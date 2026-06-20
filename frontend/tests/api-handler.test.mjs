import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/[...path].js";

function responseRecorder() {
  return {
    code: 0,
    body: null,
    setHeader() {},
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return body;
    },
  };
}

async function call({ method = "GET", url, query = {}, body }) {
  const response = responseRecorder();
  await handler({ method, url, query, body }, response);
  return response;
}

function fiaResponse(url) {
  const requestUrl = new URL(url);
  const isGrouped = requestUrl.searchParams.get("rselected") !== "None";
  const isArea = requestUrl.searchParams.get("snum") === "2";
  const records = isGrouped
    ? [
        { ROW: "001 First group", ESTIMATE: isArea ? 500_000 : 40_000_000, SE: 2_000_000, SE_PERCENT: 5, PLOT_COUNT: 120 },
        { ROW: "002 Second group", ESTIMATE: isArea ? 600_000 : 51_000_000, SE: 2_800_000, SE_PERCENT: 5.5, PLOT_COUNT: 130 },
      ]
    : [{ ESTIMATE: isArea ? 1_100_000 : 91_000_000, SE: 4_800_000, SE_PERCENT: 5.3, PLOT_COUNT: 250 }];
  return { ok: true, headers: { get: () => "application/json" }, json: async () => ({ estimates: records }) };
}

test("deployed URL paths resolve without a catch-all query parameter", async () => {
  const health = await call({ url: "/api/health" });
  const states = await call({ url: "/api/geographies/states" });
  const counties = await call({ url: "/api/geographies/counties?state=VT" });
  assert.equal(health.code, 200);
  assert.equal(states.code, 200);
  assert.equal(counties.code, 200);
  assert.ok(states.body.length >= 51);
  assert.ok(counties.body.length > 0);
});

test("nested FIA evaluation parameters expose every published state year", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ parameters: { values: [{ value: "332025 New Hampshire" }, { VALUE: 332024 }, { code: "332023" }, { value: "422025 Pennsylvania" }] } }),
  });
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await call({ url: "/api/options/evaluation-years?state=NH" });
  assert.equal(response.code, 200);
  assert.deepEqual(response.body, [2025, 2024, 2023]);
});

test("recent evaluation groups are probed when FIA's parameter catalog fails", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/parameters/wc")) return { ok: false, status: 503 };
    const wc = new URL(requestUrl).searchParams.get("wc") || "";
    const supported = wc.endsWith("2024") || wc.endsWith("2023");
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ estimates: supported ? [{ ESTIMATE: 1_000_000 }] : [] }),
    };
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await call({ url: "/api/options/evaluation-years?state=ID" });
  assert.equal(response.code, 200);
  assert.deepEqual(response.body, [2024, 2023]);
});

test("every estimate type produces a normalized official result", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => fiaResponse(url);
  context.after(() => { globalThis.fetch = originalFetch; });

  const estimateTypes = [
    "forest_area", "total_carbon", "growing_stock_volume", "live_tree_carbon",
    "standing_dead_carbon", "live_aboveground_carbon", "live_belowground_carbon",
    "dead_wood_carbon", "litter_carbon", "soil_organic_carbon",
  ];
  for (const estimateType of estimateTypes) {
    const response = await call({
      method: "POST",
      url: "/api/estimate",
      body: {
        geography: { type: "state", states: ["VT"], counties: [] },
        estimate_type: estimateType,
        grouping: "state",
        evaluation_year: 2023,
        filters: {},
        live_data: true,
      },
    });
    assert.equal(response.code, 200, `${estimateType}: ${JSON.stringify(response.body)}`);
    assert.equal(response.body.source_mode, "live");
    assert.equal(response.body.rows.length, 1);
  }
});

test("valid FIADB JSON is accepted even when its content-type header is incorrect", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const isArea = new URL(String(url)).searchParams.get("snum") === "2";
    return {
      ok: true,
      headers: { get: () => "text/html; charset=utf-8" },
      json: async () => ({ estimates: [{ ROW: "001 Test County", ESTIMATE: isArea ? 500_000 : 900_000_000, SE: 20_000_000, SE_PERCENT: 2.2, PLOT_COUNT: 90 }] }),
    };
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await call({
    method: "POST",
    url: "/api/estimate",
    body: {
      geography: { type: "state", states: ["UT"], counties: [] },
      estimate_type: "growing_stock_volume",
      grouping: "county",
      evaluation_year: 2023,
      filters: {},
      live_data: true,
    },
  });
  assert.equal(response.code, 200, JSON.stringify(response.body));
  assert.equal(response.body.rows[0].label, "Test County");
});

test("every FIA row grouping preserves separate result rows", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => fiaResponse(url);
  context.after(() => { globalThis.fetch = originalFetch; });

  const groupings = ["county", "forest_type_group", "ownership_group", "stand_size_class", "age_class", "reserved_status"];
  for (const grouping of groupings) {
    const response = await call({
      method: "POST",
      url: "/api/estimate",
      body: {
        geography: { type: "state", states: ["VT"], counties: [] },
        estimate_type: "total_carbon",
        grouping,
        evaluation_year: 2023,
        filters: {},
        live_data: true,
      },
    });
    assert.equal(response.code, 200, `${grouping}: ${JSON.stringify(response.body)}`);
    assert.deepEqual(response.body.rows.map((row) => row.label), ["First group", "Second group"]);
  }
});

test("county geography, carbon pools, and all advanced filters reach FIA", async (context) => {
  const requestedUrls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requestedUrls.push(String(url));
    return fiaResponse(url);
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const county = await call({
    method: "POST",
    url: "/api/estimate",
    body: {
      geography: { type: "county", states: ["VT"], counties: ["50001"] },
      estimate_type: "total_carbon",
      grouping: "county",
      evaluation_year: 2023,
      filters: {
        forest_type_group: "100:119",
        ownership_group: "40",
        stand_size_class: "1",
        reserved_status: "0",
      },
      live_data: true,
    },
  });
  assert.equal(county.code, 200, JSON.stringify(county.body));
  const filters = requestedUrls.map((url) => new URL(url).searchParams.get("strFilter") || "");
  assert.ok(filters.some((value) => value.includes("plot.COUNTYCD = 1")));
  assert.ok(filters.some((value) => value.includes("cond.FORTYPCD BETWEEN 100 AND 119")));
  assert.ok(filters.some((value) => value.includes("cond.OWNGRPCD = 40")));
  assert.ok(filters.some((value) => value.includes("cond.STDSZCD = 1")));
  assert.ok(filters.some((value) => value.includes("cond.RESERVCD = 0")));

  const pools = await call({
    method: "POST",
    url: "/api/estimate",
    body: {
      geography: { type: "state", states: ["VT"], counties: [] },
      estimate_type: "total_carbon",
      grouping: "carbon_pool",
      evaluation_year: 2023,
      filters: {},
      live_data: true,
    },
  });
  assert.equal(pools.code, 200, JSON.stringify(pools.body));
  assert.equal(pools.body.rows.length, 5);
});
