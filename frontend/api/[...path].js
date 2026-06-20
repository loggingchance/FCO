const STATES = [
  { code: "WI", name: "Wisconsin" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "NY", name: "New York" },
  { code: "VT", name: "Vermont" },
  { code: "ME", name: "Maine" },
];

const COUNTIES = [
  { state: "WI", name: "Ashland County", fips: "55003" },
  { state: "WI", name: "Bayfield County", fips: "55007" },
  { state: "WI", name: "Forest County", fips: "55041" },
  { state: "WI", name: "Oneida County", fips: "55085" },
  { state: "WI", name: "Vilas County", fips: "55125" },
  { state: "MI", name: "Marquette County", fips: "26103" },
  { state: "MI", name: "Houghton County", fips: "26061" },
  { state: "MN", name: "St. Louis County", fips: "27137" },
  { state: "NY", name: "Essex County", fips: "36031" },
  { state: "VT", name: "Windsor County", fips: "50027" },
  { state: "ME", name: "Piscataquis County", fips: "23021" },
];

const ESTIMATE_TYPES = [
  { id: "forest_area", label: "Forest area", unit: "acres" },
  { id: "total_carbon", label: "Total carbon stock", unit: "metric tonnes carbon" },
];

const STATE_FIPS = { ME: 23, MI: 26, MN: 27, NY: 36, VT: 50, WI: 55 };
const DEFINITIONS = {
  forest_area: { snum: 2, label: "Forest area", unit: "acres" },
  total_carbon: { snum: 97, label: "Total forest carbon", unit: "metric tonnes carbon" },
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

async function fiaRecord(state, year, definition, countyFips = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const parameters = new URLSearchParams({
    pselected: "State code",
    snum: String(definition.snum),
    wc: `${STATE_FIPS[state]}${year}`,
    rselected: "None",
    cselected: "None",
    outputFormat: "NJSON",
  });
  if (countyFips) parameters.set("strFilter", `plot.COUNTYCD = ${Number(countyFips.slice(-3))}`);

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
    const record = payload?.estimates?.[0];
    if (!record) throw new Error("FIADB returned no estimate");
    return record;
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
  if (!STATE_FIPS[state] || !["state", "county"].includes(request?.geography?.type)) throw new Error("Live estimates require one listed state or county");
  if (countyFips && (!COUNTIES.some((county) => county.fips === countyFips) || !countyFips.startsWith(String(STATE_FIPS[state])))) throw new Error("The selected county does not match the selected state");
  if (!definition) throw new Error("This estimate type is not enabled for live FIA requests");
  if (request?.grouping && request.grouping !== request.geography.type) throw new Error("The result grouping must match the selected geography");
  if (request?.filters && Object.keys(request.filters).length) throw new Error("Live advanced filters are not enabled");

  const [record, areaRecord] = await Promise.all([
    fiaRecord(state, year, definition, countyFips),
    request.estimate_type === "forest_area" ? Promise.resolve(null) : fiaRecord(state, year, DEFINITIONS.forest_area, countyFips),
  ]);
  const value = numberValue(record, "ESTIMATE");
  const samplingError = numberValue(record, "SE_PERCENT");
  const plotCount = Math.round(numberValue(record, "PLOT_COUNT"));
  if (!Number.isFinite(value) || value <= 0) throw new Error("FIADB returned an invalid estimate");

  let area = value;
  let perAcre = 1;
  if (request.estimate_type !== "forest_area") {
    area = numberValue(areaRecord, "ESTIMATE");
    if (!Number.isFinite(area) || area <= 0) throw new Error("FIADB returned an invalid forest area");
    perAcre = value / area;
  }

  const label = countyFips
    ? COUNTIES.find((county) => county.fips === countyFips)?.name || countyFips
    : STATES.find((item) => item.code === state)?.name || state;
  const warnings = ["Official broad-area FIA/EVALIDator estimate; do not use it as a parcel, stand, or offset-project estimate."];
  if (samplingError >= 20) warnings.push("Sampling error is 20% or greater; interpret this estimate cautiously.");
  if (plotCount > 0 && plotCount < 30) warnings.push("Fewer than 30 plots contribute to this estimate; reliability may be limited.");

  return {
    request,
    headline: { label: definition.label, value, unit: definition.unit, per_acre: perAcre },
    rows: [{
      label,
      total: value,
      per_acre: perAcre,
      area_acres: area,
      sampling_error_percent: samplingError || null,
      plot_count: plotCount || null,
      unit: definition.unit,
    }],
    warnings,
    method_note: `Official FIADB-API fullreport estimate using attribute ${definition.snum}, evaluation group ${STATE_FIPS[state]}${year}${countyFips ? `, and county filter ${countyFips}` : ""}.`,
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
  if (request.method === "POST" && path === "estimate") {
    try {
      return response.status(200).json(await officialEstimate(request.body));
    } catch (error) {
      return response.status(502).json({ detail: error instanceof Error ? error.message : "Official FIA request failed" });
    }
  }

  return response.status(404).json({ detail: "Not found" });
}
