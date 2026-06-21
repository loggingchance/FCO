import { COUNTIES, STATES } from "../shared/counties.js";
import { ADVANCED_FILTERS } from "../shared/fiaOptions.js";

const ESTIMATE_TYPES = [
  { id: "forest_area", label: "Forest area", unit: "acres" },
  { id: "total_carbon", label: "Total forest carbon", unit: "metric tonnes carbon" },
  { id: "growing_stock_volume", label: "Growing-stock volume", unit: "cubic feet" },
  { id: "live_tree_carbon", label: "Live tree carbon", unit: "metric tonnes carbon" },
  { id: "standing_dead_carbon", label: "Standing dead tree carbon", unit: "metric tonnes carbon" },
  { id: "live_aboveground_carbon", label: "Live aboveground carbon", unit: "metric tonnes carbon" },
  { id: "live_belowground_carbon", label: "Live belowground carbon", unit: "metric tonnes carbon" },
  { id: "dead_wood_carbon", label: "Dead wood carbon", unit: "metric tonnes carbon" },
  { id: "litter_carbon", label: "Litter carbon", unit: "metric tonnes carbon" },
  { id: "soil_organic_carbon", label: "Soil organic carbon", unit: "metric tonnes carbon" },
];

const SHORT_TONS_TO_METRIC_TONNES = 0.90718474;
const STATE_FIPS = Object.fromEntries(STATES.map((state) => [state.code, state.fips]));
const DEFINITIONS = {
  forest_area: { snum: 2, label: "Forest area", unit: "acres" },
  total_carbon: { snum: 103, label: "Total forest carbon", unit: "metric tonnes carbon" },
  growing_stock_volume: { snum: 15, label: "Growing-stock volume", unit: "cubic feet" },
  live_tree_carbon: { snum: 55000, label: "Live tree carbon", unit: "metric tonnes carbon", sourceUnit: "short tons carbon", multiplier: SHORT_TONS_TO_METRIC_TONNES },
  standing_dead_carbon: { snum: 47000, label: "Standing dead tree carbon", unit: "metric tonnes carbon", sourceUnit: "short tons carbon", multiplier: SHORT_TONS_TO_METRIC_TONNES },
  live_aboveground_carbon: { snum: 98, label: "Live aboveground carbon", unit: "metric tonnes carbon" },
  live_belowground_carbon: { snum: 99, label: "Live belowground carbon", unit: "metric tonnes carbon" },
  dead_wood_carbon: { snum: 100, label: "Dead wood carbon", unit: "metric tonnes carbon" },
  litter_carbon: { snum: 101, label: "Litter carbon", unit: "metric tonnes carbon" },
  soil_organic_carbon: { snum: 102, label: "Soil organic carbon", unit: "metric tonnes carbon" },
};

const CARBON_POOLS = [
  ["Live aboveground", DEFINITIONS.live_aboveground_carbon],
  ["Live belowground", DEFINITIONS.live_belowground_carbon],
  ["Dead wood", DEFINITIONS.dead_wood_carbon],
  ["Litter", DEFINITIONS.litter_carbon],
  ["Soil organic", DEFINITIONS.soil_organic_carbon],
];

const GROUPINGS = {
  state: null,
  county: "County code and name",
  forest_type_group: "Forest type group",
  ownership_group: "Ownership group",
  stand_size_class: "Stand-size class",
  age_class: "Stand age 20 yr classes (0 to 500 plus)",
  reserved_status: "Reserved status class",
  carbon_pool: null,
};

export const config = { maxDuration: 60 };

function routePath(request) {
  const value = request.query?.path;
  const parameterPath = (Array.isArray(value) ? value : [value]).filter(Boolean).join("/");
  if (parameterPath) return parameterPath;

  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  return pathname.replace(/^\/api\/?/, "").replace(/^\/+|\/+$/g, "");
}

function queryParameter(request, name) {
  const value = request.query?.[name];
  if (value !== undefined && value !== null) return Array.isArray(value) ? value[0] : value;
  return new URL(request.url || "/", "http://localhost").searchParams.get(name) || "";
}

const USAGE_EVENTS = new Set([
  "page_view", "estimate_generated", "estimate_failed", "comparison_generated",
  "comparison_failed", "export_created", "feedback_opened",
]);

function usageWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function cleanUsageValue(value) {
  return String(value ?? "")
    .replace(/[^a-zA-Z0-9 _.-]/g, "")
    .trim()
    .slice(0, 80) || "unknown";
}

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL || process.env.STORAGE_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN || process.env.STORAGE_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`Usage store returned HTTP ${response.status}`);
  return response.json();
}

async function recordUsage(body = {}) {
  const event = cleanUsageValue(body.event);
  if (!USAGE_EVENTS.has(event)) return;
  const dimensions = body.dimensions && typeof body.dimensions === "object" ? body.dimensions : {};
  const allowedDimensions = ["page", "state", "geography", "estimate", "grouping", "year", "format"];
  const detail = allowedDimensions
    .filter((key) => dimensions[key] !== undefined && dimensions[key] !== "")
    .map((key) => `${key}=${cleanUsageValue(dimensions[key])}`)
    .join("|");
  const key = `fco:usage:${usageWeekKey()}`;
  await redisCommand(["HINCRBY", key, `event:${event}`, 1]);
  if (detail) await redisCommand(["HINCRBY", key, `detail:${event}|${detail}`, 1]);
}

function escapeReportHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

async function sendWeeklyUsageReport() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL || process.env.STORAGE_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN || process.env.STORAGE_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  if (!redisUrl || !redisToken || !resendKey) throw new Error("Weekly reporting environment variables are incomplete");

  const reportWeek = usageWeekKey(new Date(Date.now() - 3 * 86400000));
  const stored = await redisCommand(["HGETALL", `fco:usage:${reportWeek}`]);
  const values = stored?.result || [];
  const entries = [];
  for (let index = 0; index < values.length; index += 2) entries.push([String(values[index]), Number(values[index + 1]) || 0]);
  const summary = entries.filter(([key]) => key.startsWith("event:")).sort((a, b) => b[1] - a[1]);
  const details = entries.filter(([key]) => key.startsWith("detail:")).sort((a, b) => b[1] - a[1]).slice(0, 40);
  const total = summary.reduce((sum, [, count]) => sum + count, 0);
  const rows = (items) => items.length
    ? items.map(([label, count]) => `<tr><td>${escapeReportHtml(label.replace(/^(event|detail):/, "").replaceAll("|", " / "))}</td><td style="text-align:right">${count}</td></tr>`).join("")
    : '<tr><td colspan="2">No activity recorded.</td></tr>';
  const html = `<!doctype html><html><body style="font:15px/1.45 Arial,sans-serif;color:#18211b;max-width:760px;margin:auto"><h1 style="color:#245b3b">FCO weekly usage report</h1><p><strong>Week:</strong> ${reportWeek}<br><strong>Total recorded actions:</strong> ${total}</p><h2>Activity summary</h2><table style="width:100%;border-collapse:collapse">${rows(summary)}</table><h2>Top usage details</h2><table style="width:100%;border-collapse:collapse">${rows(details)}</table><p style="color:#5d6b61">Privacy note: FCO records aggregate product events only. It does not store cookies, user identities, or IP addresses in the usage report.</p></body></html>`;
  const text = [`FCO weekly usage report - ${reportWeek}`, `Total recorded actions: ${total}`, "", ...summary.map(([label, count]) => `${label.replace("event:", "")}: ${count}`), "", ...details.map(([label, count]) => `${label.replace("detail:", "")}: ${count}`)].join("\n");
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FCO_REPORT_FROM || "FCO Reports <onboarding@resend.dev>",
      to: [process.env.FCO_REPORT_EMAIL || "steve@northeastforests.com"],
      subject: `FCO weekly usage report - ${reportWeek}`,
      html,
      text,
    }),
  });
  if (!emailResponse.ok) throw new Error(`Email service returned HTTP ${emailResponse.status}`);
  return { status: "sent", week: reportWeek, total };
}

function numberValue(record, key) {
  const value = record?.[key];
  if (value === null || value === undefined || value === "" || value === "--") return null;
  const parsed = Number(String(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function estimateValue(record, key, definition) {
  const value = numberValue(record, key);
  return value === null ? null : value * (definition.multiplier || 1);
}

async function evaluationYears(state) {
  if (!STATE_FIPS[state]) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch("https://apps.fs.usda.gov/fiadb-api/fullreport/parameters/wc", {
      headers: { "User-Agent": "FCO/0.1 FIADB validation client" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`FIADB parameter service returned HTTP ${response.status}`);
    const payload = await response.json();
    const primitiveValues = [];
    const visit = (value) => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (value && typeof value === "object") return Object.values(value).forEach(visit);
      if (value !== null && value !== undefined) primitiveValues.push(String(value));
    };
    visit(payload);

    const prefix = STATE_FIPS[state];
    const pattern = new RegExp(`(?:^|\\D)${prefix}(20\\d{2})(?:\\D|$)`, "g");
    const years = primitiveValues.flatMap((value) => [...value.matchAll(pattern)].map((match) => Number(match[1])));
    const published = [...new Set(years.filter((year) => year >= 2000 && year <= 2100))].sort((a, b) => b - a);
    if (published.length) return published;
  } catch {
    // Year metadata is optional; the estimate request remains the authority.
  }
  return [];
}

function recordKey(record, index) {
  return String(record?.ROW ?? record?.ROW_NAME ?? record?.RNAME ?? record?.GRP2 ?? record?.GRP1 ?? index);
}

function groupLabel(record, fallback) {
  const raw = String(record?.ROW ?? record?.ROW_NAME ?? record?.RNAME ?? record?.GRP2 ?? record?.GRP1 ?? "").replace(/^`/, "").trim();
  return raw ? raw.replace(/^[`'"]+/, "").replace(/^\d+\s+(?:[A-Z]{2}\s+)?/, "") : fallback;
}

function filterExpression(countyFips, filters = {}) {
  const clauses = [];
  if (countyFips) clauses.push(`plot.COUNTYCD = ${Number(countyFips.slice(-3))}`);

  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    const allowed = ADVANCED_FILTERS[key]?.options.some(([option]) => option === value);
    if (!allowed) throw new Error(`Unsupported ${key.replaceAll("_", " ")} filter`);
    if (key === "forest_type_group") {
      const [minimum, maximum] = value.split(":").map(Number);
      clauses.push(`cond.FORTYPCD BETWEEN ${minimum} AND ${maximum}`);
    } else if (key === "ownership_group") {
      clauses.push(`cond.OWNGRPCD = ${Number(value)}`);
    } else if (key === "stand_size_class") {
      clauses.push(`cond.STDSZCD = ${Number(value)}`);
    } else if (key === "reserved_status") {
      clauses.push(`cond.RESERVCD = ${Number(value)}`);
    }
  }
  return clauses.join(" AND ");
}

async function fiaRecords(state, year, definition, countyFips = null, rowGrouping = null, filters = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  const parameters = new URLSearchParams({
    pselected: "State code",
    snum: String(definition.snum),
    wc: `${STATE_FIPS[state]}${year}`,
    rselected: rowGrouping || "None",
    cselected: "None",
    outputFormat: "NJSON",
  });
  const strFilter = filterExpression(countyFips, filters);
  if (strFilter) parameters.set("strFilter", strFilter);

  try {
    const response = await fetch(`https://apps.fs.usda.gov/fiadb-api/fullreport?${parameters}`, {
      method: "GET",
      headers: {
        "User-Agent": "FCO/0.1 FIADB validation client",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`FIADB returned HTTP ${response.status}`);
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error("FIADB returned an unreadable response instead of estimate data");
    }
    const records = payload?.estimates || [];
    if (!records.length) throw new Error("FIADB returned no estimates");
    return records;
  } finally {
    clearTimeout(timeout);
  }
}

async function countyBoundary(fips) {
  const county = COUNTIES.find((item) => item.fips === fips);
  if (!county) throw new Error("Unknown county FIPS code");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const service = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer";
  const parameters = new URLSearchParams({
    where: `GEOID='${fips}'`,
    outFields: "NAME,STATE,COUNTY",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });
  try {
    const metadataResponse = await fetch(`${service}?f=json`, {
      headers: { "User-Agent": "FCO/0.1 county boundary client" },
      signal: controller.signal,
    });
    if (!metadataResponse.ok) throw new Error(`Census TIGERweb metadata returned HTTP ${metadataResponse.status}`);
    const metadata = await metadataResponse.json();
    const countyLayer = metadata?.layers?.find((layer) => /^counties$/i.test(String(layer?.name || "")))
      || metadata?.layers?.find((layer) => /count/i.test(String(layer?.name || "")));
    if (!Number.isInteger(countyLayer?.id)) throw new Error("Census TIGERweb county layer was not found");

    const response = await fetch(`${service}/${countyLayer.id}/query?${parameters}`, {
      headers: { "User-Agent": "FCO/0.1 county boundary client" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Census TIGERweb returned HTTP ${response.status}`);
    const payload = await response.json();
    const geometry = payload?.features?.[0]?.geometry;
    if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) throw new Error("Census TIGERweb returned no county boundary");
    return { name: county.name, geometry, source: "U.S. Census Bureau TIGERweb" };
  } finally {
    clearTimeout(timeout);
  }
}

async function officialEstimate(request) {
  if (request?.live_data !== true) throw new Error("Official FIA data must be explicitly requested");
  const state = request?.geography?.states?.[0];
  const countyFips = request?.geography?.type === "county" ? request?.geography?.counties?.[0] : null;
  const year = Number(request?.evaluation_year);
  const definition = DEFINITIONS[request?.estimate_type];
  const grouping = request?.grouping || request?.geography?.type || "state";
  if (!STATE_FIPS[state] || !["state", "county"].includes(request?.geography?.type)) throw new Error("Live estimates require one listed state or county");
  if (countyFips && (!COUNTIES.some((county) => county.fips === countyFips) || !countyFips.startsWith(STATE_FIPS[state]))) throw new Error("The selected county does not match the selected state");
  if (!definition) throw new Error("This estimate type is not enabled for live FIA requests");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Select an FIA evaluation year");
  if (!(grouping in GROUPINGS)) throw new Error("This result grouping is not enabled");
  if (grouping === "carbon_pool" && request.estimate_type !== "total_carbon") throw new Error("Carbon-pool grouping requires total forest carbon");
  filterExpression(countyFips, request?.filters);

  const geographyLabel = countyFips
    ? COUNTIES.find((county) => county.fips === countyFips)?.name || countyFips
    : STATES.find((item) => item.code === state)?.name || state;
  let rows;

  if (grouping === "carbon_pool") {
    const [areaRecords, ...poolRecordSets] = await Promise.all([
      fiaRecords(state, year, DEFINITIONS.forest_area, countyFips, null, request.filters),
      ...CARBON_POOLS.map(([, poolDefinition]) => fiaRecords(state, year, poolDefinition, countyFips, null, request.filters)),
    ]);
    const area = estimateValue(areaRecords[0], "ESTIMATE", DEFINITIONS.forest_area);
    if (!Number.isFinite(area) || area <= 0) throw new Error("FIADB returned an invalid forest area");
    rows = poolRecordSets.map((records, index) => {
      const record = records[0];
      const total = estimateValue(record, "ESTIMATE", CARBON_POOLS[index][1]);
      if (total === null) throw new Error(`FIADB returned an invalid ${CARBON_POOLS[index][0]} estimate`);
      return {
        label: CARBON_POOLS[index][0],
        total,
        per_acre: total / area,
        area_acres: area,
        standard_error: estimateValue(record, "SE", CARBON_POOLS[index][1]),
        sampling_error_percent: numberValue(record, "SE_PERCENT") || null,
        plot_count: Math.round(numberValue(record, "PLOT_COUNT")) || null,
        unit: definition.unit,
      };
    });
  } else {
    const rowGrouping = grouping === request.geography.type ? null : GROUPINGS[grouping];
    const [estimateRecords, areaRecords] = await Promise.all([
      fiaRecords(state, year, definition, countyFips, rowGrouping, request.filters),
      request.estimate_type === "forest_area"
        ? Promise.resolve(null)
        : fiaRecords(state, year, DEFINITIONS.forest_area, countyFips, rowGrouping, request.filters),
    ]);
    const areaByGroup = new Map((areaRecords || []).map((record, index) => [recordKey(record, index), estimateValue(record, "ESTIMATE", DEFINITIONS.forest_area)]));
    rows = estimateRecords.map((record, index) => {
      const total = estimateValue(record, "ESTIMATE", definition);
      const area = request.estimate_type === "forest_area" ? total : areaByGroup.get(recordKey(record, index)) || 0;
      if (total === null) return null;
      return {
        label: rowGrouping ? groupLabel(record, geographyLabel) : geographyLabel,
        total,
        per_acre: request.estimate_type === "forest_area" ? 1 : (area ? total / area : 0),
        area_acres: area,
        standard_error: estimateValue(record, "SE", definition),
        sampling_error_percent: numberValue(record, "SE_PERCENT") || null,
        plot_count: Math.round(numberValue(record, "PLOT_COUNT")) || null,
        unit: definition.unit,
      };
    }).filter((row) => row && Number.isFinite(row.total) && row.total > 0);
    if (rowGrouping && rows.some((row) => row.label === geographyLabel)) {
      throw new Error(`FIADB did not return the requested ${grouping.replaceAll("_", " ")} grouping`);
    }
  }

  if (!rows.length) throw new Error("FIADB returned no usable estimates");
  const value = rows.reduce((sum, row) => sum + row.total, 0);
  const area = grouping === "carbon_pool"
    ? rows[0].area_acres
    : rows.reduce((sum, row) => sum + row.area_acres, 0);
  const perAcre = request.estimate_type === "forest_area" ? 1 : (area ? value / area : 0);
  const warnings = ["Official broad-area FIA/EVALIDator estimate; do not use it as a parcel, stand, or offset-project estimate."];
  if (rows.some((row) => (row.sampling_error_percent || 0) >= 20)) warnings.push("One or more rows have sampling error of 20% or greater; interpret them cautiously.");
  if (rows.some((row) => row.plot_count && row.plot_count < 30)) warnings.push("One or more rows use fewer than 30 plots; reliability may be limited.");

  return {
    request,
    headline: { label: definition.label, value, unit: definition.unit, per_acre: perAcre },
    rows,
    warnings,
    method_note: `Official FIADB-API fullreport estimate using attribute ${definition.snum}, evaluation group ${STATE_FIPS[state]}${year}${countyFips ? `, county filter ${countyFips}` : ""}, and ${grouping.replaceAll("_", " ")} grouping.${definition.multiplier ? ` FIA reports this attribute in ${definition.sourceUnit}; FCO converts it to metric tonnes carbon using 1 short ton = ${SHORT_TONS_TO_METRIC_TONNES} metric tonnes.` : ""}`,
    data_source: "USDA Forest Service FIA FIADB-API / EVALIDator",
    source_mode: "live",
    evaluation_year: year,
    generated_at: new Date().toISOString(),
  };
}

export default async function handler(request, response) {
  const path = routePath(request);
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (request.method === "OPTIONS") return response.status(204).end();

  if (request.method === "GET" && path === "health") return response.status(200).json({ status: "ok", app: "FCO - Forest Carbon Online" });
  if (request.method === "GET" && path === "geographies/states") return response.status(200).json(STATES);
  if (request.method === "GET" && path === "geographies/counties") {
    const state = String(queryParameter(request, "state"));
    return response.status(200).json(state ? COUNTIES.filter((county) => county.state === state) : COUNTIES);
  }
  if (request.method === "GET" && path === "geographies/county-boundary") {
    try {
      response.setHeader("Cache-Control", "s-maxage=2592000, stale-while-revalidate=31536000");
      return response.status(200).json(await countyBoundary(String(queryParameter(request, "fips"))));
    } catch (error) {
      return response.status(502).json({ detail: error instanceof Error ? error.message : "County boundary unavailable" });
    }
  }
  if (request.method === "GET" && path === "options/estimate-types") return response.status(200).json(ESTIMATE_TYPES);
  if (request.method === "GET" && path === "options/evaluation-years") {
    try {
      response.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
      return response.status(200).json(await evaluationYears(String(queryParameter(request, "state"))));
    } catch (error) {
      return response.status(502).json({ detail: error instanceof Error ? error.message : "Evaluation years unavailable" });
    }
  }
  if (request.method === "POST" && path === "estimate") {
    try {
      return response.status(200).json(await officialEstimate(request.body));
    } catch (error) {
      return response.status(502).json({ detail: error instanceof Error ? error.message : "Official FIA request failed" });
    }
  }
  if (request.method === "POST" && path === "analytics/event") {
    try {
      await recordUsage(request.body);
    } catch {
      // Analytics must never interrupt the user's work.
    }
    return response.status(204).end();
  }
  if (request.method === "GET" && path === "analytics/weekly-report") {
    const expected = process.env.CRON_SECRET;
    const authorization = request.headers?.authorization || "";
    if (!expected || authorization !== `Bearer ${expected}`) return response.status(401).json({ detail: "Unauthorized" });
    try {
      return response.status(200).json(await sendWeeklyUsageReport());
    } catch (error) {
      return response.status(500).json({ detail: error instanceof Error ? error.message : "Weekly report failed" });
    }
  }

  return response.status(404).json({ detail: "Not found" });
}
