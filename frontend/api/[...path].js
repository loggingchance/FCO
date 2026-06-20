import { COUNTIES, STATES } from "../shared/counties.js";
import { ADVANCED_FILTERS } from "../shared/fiaOptions.js";

const ESTIMATE_TYPES = [
  { id: "forest_area", label: "Forest area", unit: "acres" },
  { id: "total_carbon", label: "Total forest carbon", unit: "metric tonnes carbon" },
  { id: "growing_stock_volume", label: "Growing-stock volume", unit: "cubic feet" },
  { id: "live_tree_carbon", label: "Live tree carbon", unit: "short tons carbon" },
  { id: "standing_dead_carbon", label: "Standing dead tree carbon", unit: "short tons carbon" },
  { id: "live_aboveground_carbon", label: "Live aboveground carbon", unit: "metric tonnes carbon" },
  { id: "live_belowground_carbon", label: "Live belowground carbon", unit: "metric tonnes carbon" },
  { id: "dead_wood_carbon", label: "Dead wood carbon", unit: "metric tonnes carbon" },
  { id: "litter_carbon", label: "Litter carbon", unit: "metric tonnes carbon" },
  { id: "soil_organic_carbon", label: "Soil organic carbon", unit: "metric tonnes carbon" },
];

const STATE_FIPS = Object.fromEntries(STATES.map((state) => [state.code, state.fips]));
const DEFINITIONS = {
  forest_area: { snum: 2, label: "Forest area", unit: "acres" },
  total_carbon: { snum: 103, label: "Total forest carbon", unit: "metric tonnes carbon" },
  growing_stock_volume: { snum: 15, label: "Growing-stock volume", unit: "cubic feet" },
  live_tree_carbon: { snum: 55000, label: "Live tree carbon", unit: "short tons carbon" },
  standing_dead_carbon: { snum: 47000, label: "Standing dead tree carbon", unit: "short tons carbon" },
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

export const config = { maxDuration: 30 };

function routePath(request) {
  const value = request.query?.path;
  return (Array.isArray(value) ? value : [value]).filter(Boolean).join("/");
}

function numberValue(record, key) {
  const value = record?.[key];
  if (value === null || value === undefined || value === "" || value === "--") return 0;
  return Number(String(value).replaceAll(",", ""));
}

async function evaluationYears(state) {
  if (!STATE_FIPS[state]) return [];
  const response = await fetch("https://apps.fs.usda.gov/fiadb-api/fullreport/parameters/wc", { headers: { "User-Agent": "FCO/0.1 FIADB validation client" } });
  if (!response.ok) throw new Error(`FIADB parameter service returned HTTP ${response.status}`);
  const values = await response.json();
  return [...new Set(values
    .map((item) => String(item.value ?? item.VALUE ?? ""))
    .filter((value) => value.startsWith(STATE_FIPS[state]))
    .map((value) => Number(value.slice(-4)))
    .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100))]
    .sort((a, b) => b - a);
}

function recordKey(record, index) {
  return String(record?.GRP2 ?? record?.GRP1 ?? index);
}

function groupLabel(record, fallback) {
  const raw = String(record?.GRP2 ?? record?.GRP1 ?? "").replace(/^`/, "").trim();
  return raw ? raw.replace(/^\d+\s+/, "") : fallback;
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
  const timeout = setTimeout(() => controller.abort(), 12000);
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
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("json")) throw new Error("FIADB did not return JSON");
    const payload = await response.json();
    const records = payload?.estimates || [];
    if (!records.length) throw new Error("FIADB returned no estimates");
    return records;
  } finally {
    clearTimeout(timeout);
  }
}

async function officialEstimate(request) {
  if (request?.live_data === false) throw new Error("Official FIA data was not requested");
  const state = request?.geography?.states?.[0];
  const countyFips = request?.geography?.type === "county" ? request?.geography?.counties?.[0] : null;
  const year = request?.evaluation_year || 2023;
  const definition = DEFINITIONS[request?.estimate_type];
  const grouping = request?.grouping || request?.geography?.type || "state";
  if (!STATE_FIPS[state] || !["state", "county"].includes(request?.geography?.type)) throw new Error("Live estimates require one listed state or county");
  if (countyFips && (!COUNTIES.some((county) => county.fips === countyFips) || !countyFips.startsWith(STATE_FIPS[state]))) throw new Error("The selected county does not match the selected state");
  if (!definition) throw new Error("This estimate type is not enabled for live FIA requests");
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
    const area = numberValue(areaRecords[0], "ESTIMATE");
    if (!Number.isFinite(area) || area <= 0) throw new Error("FIADB returned an invalid forest area");
    rows = poolRecordSets.map((records, index) => {
      const record = records[0];
      const total = numberValue(record, "ESTIMATE");
      return {
        label: CARBON_POOLS[index][0],
        total,
        per_acre: total / area,
        area_acres: area,
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
    const areaByGroup = new Map((areaRecords || []).map((record, index) => [recordKey(record, index), numberValue(record, "ESTIMATE")]));
    rows = estimateRecords.map((record, index) => {
      const total = numberValue(record, "ESTIMATE");
      const area = request.estimate_type === "forest_area" ? total : areaByGroup.get(recordKey(record, index)) || 0;
      return {
        label: groupLabel(record, geographyLabel),
        total,
        per_acre: request.estimate_type === "forest_area" ? 1 : (area ? total / area : 0),
        area_acres: area,
        sampling_error_percent: numberValue(record, "SE_PERCENT") || null,
        plot_count: Math.round(numberValue(record, "PLOT_COUNT")) || null,
        unit: definition.unit,
      };
    }).filter((row) => Number.isFinite(row.total) && row.total > 0);
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
    method_note: `Official FIADB-API fullreport estimate using attribute ${definition.snum}, evaluation group ${STATE_FIPS[state]}${year}${countyFips ? `, county filter ${countyFips}` : ""}, and ${grouping.replaceAll("_", " ")} grouping.`,
    data_source: "USDA Forest Service FIA FIADB-API / EVALIDator",
    source_mode: "live",
    evaluation_year: year,
    generated_at: new Date().toISOString(),
  };
}

export default async function handler(request, response) {
  const path = routePath(request);
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "GET" && path === "health") return response.status(200).json({ status: "ok", app: "FCO - Forest Carbon Online" });
  if (request.method === "GET" && path === "geographies/states") return response.status(200).json(STATES);
  if (request.method === "GET" && path === "geographies/counties") {
    const state = String(request.query?.state || "");
    return response.status(200).json(state ? COUNTIES.filter((county) => county.state === state) : COUNTIES);
  }
  if (request.method === "GET" && path === "options/estimate-types") return response.status(200).json(ESTIMATE_TYPES);
  if (request.method === "GET" && path === "options/evaluation-years") {
    try {
      return response.status(200).json(await evaluationYears(String(request.query?.state || "")));
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

  return response.status(404).json({ detail: "Not found" });
}
