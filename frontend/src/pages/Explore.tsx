import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Play } from "lucide-react";
import { EstimateChart } from "../components/EstimateChart";
import { ExportButtons } from "../components/ExportButtons";
import { MapPanel } from "../components/MapPanel";
import { api } from "../services/api";
import type { CountyOption, EstimateRequest, EstimateResponse, StateOption } from "../types";
import { alternateCarbon, formatEstimate } from "../utils/units";
import { COUNTIES, STATES } from "../../shared/counties.js";
import { ADVANCED_FILTERS } from "../../shared/fiaOptions.js";

const fallbackStates: StateOption[] = STATES;

const fallbackEstimateTypes = [
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

const estimateSamples: Record<string, { label: string; unit: string; value: (sample: { area: number; carbon: number }) => number }> = {
  forest_area: { label: "Forest area", unit: "acres", value: (sample) => sample.area },
  total_carbon: { label: "Total forest carbon", unit: "metric tonnes carbon", value: (sample) => sample.carbon },
  growing_stock_volume: { label: "Growing-stock volume", unit: "cubic feet", value: (sample) => sample.area * 1420 },
  live_tree_carbon: { label: "Live tree carbon", unit: "short tons carbon", value: (sample) => sample.carbon * .54 * 1.10231131 },
  standing_dead_carbon: { label: "Standing dead tree carbon", unit: "short tons carbon", value: (sample) => sample.carbon * .04 * 1.10231131 },
  live_aboveground_carbon: { label: "Live aboveground carbon", unit: "metric tonnes carbon", value: (sample) => sample.carbon * .46 },
  live_belowground_carbon: { label: "Live belowground carbon", unit: "metric tonnes carbon", value: (sample) => sample.carbon * .08 },
  dead_wood_carbon: { label: "Dead wood carbon", unit: "metric tonnes carbon", value: (sample) => sample.carbon * .08 },
  litter_carbon: { label: "Litter carbon", unit: "metric tonnes carbon", value: (sample) => sample.carbon * .07 },
  soil_organic_carbon: { label: "Soil organic carbon", unit: "metric tonnes carbon", value: (sample) => sample.carbon * .31 },
};

const sampleByState: Record<string, { area: number; carbon: number; se: number }> = {
  WI: { area: 17_100_000, carbon: 1_280_000_000, se: 4.8 },
  MI: { area: 20_900_000, carbon: 1_630_000_000, se: 4.2 },
  MN: { area: 15_900_000, carbon: 1_120_000_000, se: 5.1 },
  NY: { area: 18_600_000, carbon: 1_410_000_000, se: 4.6 },
  VT: { area: 4_500_000, carbon: 355_000_000, se: 6.3 },
  ME: { area: 17_600_000, carbon: 1_360_000_000, se: 4.4 },
};

function browserFallback(request: EstimateRequest): EstimateResponse {
  const stateCode = request.geography.states[0] || "WI";
  const sample = sampleByState[stateCode] || sampleByState.WI;
  const stateName = fallbackStates.find((item) => item.code === stateCode)?.name || stateCode;
  const estimate = estimateSamples[request.estimate_type] || estimateSamples.total_carbon;
  const isArea = request.estimate_type === "forest_area";
  const value = estimate.value(sample);
  const unit = estimate.unit;
  const perAcre = isArea ? 1 : value / sample.area;
  const poolRows = [
    ["Live aboveground", .46], ["Live belowground", .08], ["Dead wood", .08], ["Litter", .07], ["Soil organic", .31],
  ].map(([label, share]) => ({
    label: String(label), total: sample.carbon * Number(share), per_acre: sample.carbon * Number(share) / sample.area,
    area_acres: sample.area, sampling_error_percent: sample.se, plot_count: null, unit,
  }));

  return {
    request,
    headline: { label: estimate.label, value, unit, per_acre: perAcre },
    rows: request.grouping === "carbon_pool" ? poolRows : [{
      label: stateName,
      total: value,
      per_acre: perAcre,
      area_acres: sample.area,
      sampling_error_percent: sample.se,
      plot_count: null,
      unit,
    }],
    warnings: ["Illustrative sample data. Do not cite as an official FIA estimate."],
    method_note: "Illustrative state-level values are shown when the live FIA service cannot complete the request.",
    data_source: "FCO illustrative sample data",
    source_mode: "mock_fallback",
    evaluation_year: request.evaluation_year || null,
    generated_at: new Date().toISOString(),
  };
}

export function Explore() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [counties, setCounties] = useState<CountyOption[]>([]);
  const [estimateTypes, setEstimateTypes] = useState<{ id: string; label: string; unit: string }[]>([]);
  const [state, setState] = useState("WI");
  const [county, setCounty] = useState("");
  const [geoType, setGeoType] = useState<"state" | "county">("state");
  const [estimateType, setEstimateType] = useState("total_carbon");
  const [grouping, setGrouping] = useState("state");
  const [evaluationYear, setEvaluationYear] = useState(2023);
  const [evaluationYears, setEvaluationYears] = useState([2023, 2022, 2021, 2020]);
  const [liveData, setLiveData] = useState(true);
  const [advanced, setAdvanced] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EstimateResponse | null>(null);

  useEffect(() => {
    api.states()
      .then((items) => {
        setStates(items);
      })
      .catch(() => {
        setStates(fallbackStates);
      });
    api.estimateTypes().then(setEstimateTypes).catch(() => setEstimateTypes(fallbackEstimateTypes));
  }, []);

  useEffect(() => {
    api.counties(state).then((items) => {
      setCounties(items);
      setCounty(items[0]?.fips || "");
    }).catch(() => {
      const items = COUNTIES.filter((item) => item.state === state);
      setCounties(items);
      setCounty(items[0]?.fips || "");
    });
  }, [state]);

  useEffect(() => {
    api.evaluationYears(state).then((years) => {
      if (!years.length) return;
      setEvaluationYears(years);
      setEvaluationYear((current) => years.includes(current) ? current : years[0]);
    }).catch(() => setEvaluationYears([2023, 2022, 2021, 2020]));
  }, [state]);

  const selectedCountyName = useMemo(() => counties.find((item) => item.fips === county)?.name || "Selected county", [counties, county]);
  const groupingOptions = useMemo(() => [
    { id: geoType, label: geoType === "state" ? "State total" : "County total" },
    ...(geoType === "state" ? [{ id: "county", label: "County" }] : []),
    { id: "forest_type_group", label: "Forest type group" },
    { id: "ownership_group", label: "Ownership group" },
    { id: "stand_size_class", label: "Stand-size class" },
    { id: "age_class", label: "Stand age class" },
    { id: "reserved_status", label: "Reserved status" },
    ...(estimateType === "total_carbon" ? [{ id: "carbon_pool", label: "Carbon pool" }] : []),
  ], [geoType, estimateType]);

  function changeGeography(next: "state" | "county") {
    setGeoType(next);
    if (grouping === "state" || grouping === "county") setGrouping(next);
  }

  function changeEstimateType(next: string) {
    setEstimateType(next);
    if (grouping === "carbon_pool" && next !== "total_carbon") setGrouping(geoType);
  }

  async function generate() {
    const payload: EstimateRequest = {
      geography: { type: geoType, states: [state], counties: geoType === "county" ? [county] : [] },
      estimate_type: estimateType,
      grouping,
      evaluation_year: evaluationYear,
      live_data: liveData,
      filters: advanced ? Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) : {},
    };
    try {
      setResult(await api.estimate(payload));
    } catch {
      setResult(browserFallback(payload));
    }
  }

  return (
    <div className="page-grid">
      <section className="panel wide">
        <h1>Explore Carbon</h1>
        <p className="lede">Generate broad-area FIA-style estimates for states, counties, and regions. Results are normalized for cards, charts, tables, maps, and report exports.</p>
      </section>
      <section className="panel form-panel wide">
        <h2>Estimate setup</h2>
        <div className="form-grid">
          <fieldset className="geography-mode">
            <legend>Geography</legend>
            <div>
              <button type="button" className={geoType === "state" ? "active" : ""} onClick={() => changeGeography("state")}>State</button>
              <button type="button" className={geoType === "county" ? "active" : ""} onClick={() => changeGeography("county")}>County</button>
            </div>
          </fieldset>
          <label>
            State
            <select value={state} onChange={(e) => setState(e.target.value)}>
              {states.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}
            </select>
          </label>
          {geoType === "county" && (
            <label>
              County
              <select value={county} onChange={(e) => setCounty(e.target.value)}>
                {counties.map((item) => <option value={item.fips} key={item.fips}>{item.name}</option>)}
              </select>
            </label>
          )}
          <label>
            Estimate type
            <select value={estimateType} onChange={(e) => changeEstimateType(e.target.value)}>
              {estimateTypes.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Group results by
            <select value={grouping} onChange={(e) => setGrouping(e.target.value)}>
              {groupingOptions.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            FIA evaluation year
            <select value={evaluationYear} onChange={(e) => setEvaluationYear(Number(e.target.value))}>
              {evaluationYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </div>
        <div className="official-data-option">
          <label className="toggle-row">
            <input type="checkbox" checked={liveData} onChange={(e) => setLiveData(e.target.checked)} />
            Request official FIA/EVALIDator data
          </label>
          <p>Uses the USDA Forest Service FIA service when the selected geography, estimate, grouping, and year are supported.</p>
        </div>
        <div className="form-actions">
          <button className="link-button advanced-toggle" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
            {advanced ? "Hide advanced filters" : "Advanced filters"}<ChevronDown size={16} className={advanced ? "open" : ""} />
          </button>
          <button className="primary" onClick={generate}><Play size={17} /> Generate Results</button>
        </div>
        {advanced && (
          <div className="advanced-grid">
            {Object.entries(ADVANCED_FILTERS).map(([id, definition]) => (
              <label key={id}>
                {definition.label}
                <select value={filters[id] || ""} onChange={(event) => setFilters((current) => ({ ...current, [id]: event.target.value }))}>
                  {definition.options.map(([value, label]) => <option value={value} key={value || "all"}>{label}</option>)}
                </select>
              </label>
            ))}
          </div>
        )}
      </section>
      {result && (
        <>
          <section className="result-cards wide">
            <article>
              <span>{result.headline.label}</span><strong>{formatEstimate(result.headline.value)}</strong><em>{result.headline.unit}</em>
              {alternateCarbon(result.headline.value, result.headline.unit) && <small>{formatEstimate(alternateCarbon(result.headline.value, result.headline.unit)!.value)} {alternateCarbon(result.headline.value, result.headline.unit)!.unit}</small>}
            </article>
            <article>
              <span>Per acre</span><strong>{formatEstimate(result.headline.per_acre, 4)}</strong><em>{result.headline.unit}/acre</em>
              {alternateCarbon(result.headline.per_acre, result.headline.unit) && <small>{formatEstimate(alternateCarbon(result.headline.per_acre, result.headline.unit)!.value, 4)} {alternateCarbon(result.headline.per_acre, result.headline.unit)!.unit}/acre</small>}
            </article>
            <article><span>Sampling error</span><strong>{result.rows[0]?.sampling_error_percent ?? "N/A"}%</strong><em>{result.source_mode === "live" ? "FIA estimate" : "illustrative"}</em></article>
            <article><span>Data status</span><strong className="status-value">{result.source_mode === "live" ? "Official FIA" : "Illustrative data"}</strong><em>{result.evaluation_year || "sample data"}</em></article>
          </section>
          <section className="panel"><h2>Chart</h2><EstimateChart rows={result.rows} /></section>
          <section className="panel"><h2>Map</h2><MapPanel stateCode={state} label={geoType === "county" ? selectedCountyName : states.find((item) => item.code === state)?.name || state} /></section>
          <section className="panel wide">
            <h2>Table and exports</h2>
            <div className="warnings">{result.warnings.map((warning) => <p key={warning}><AlertTriangle size={16} /> {warning}</p>)}</div>
            <table>
              <thead><tr><th>Place</th><th>Total</th><th>Per acre</th><th>Area (acres)</th><th>Sampling error (%)</th><th>Plots (count)</th></tr></thead>
              <tbody>{result.rows.map((row) => <tr key={row.label}>
                <td>{row.label}</td>
                <td className="dual-unit-value"><strong>{formatEstimate(row.total)}</strong><span>{row.unit}</span>{alternateCarbon(row.total, row.unit) && <><strong>{formatEstimate(alternateCarbon(row.total, row.unit)!.value)}</strong><span>{alternateCarbon(row.total, row.unit)!.unit}</span></>}</td>
                <td className="dual-unit-value"><strong>{formatEstimate(row.per_acre, 4)}</strong><span>{row.unit}/acre</span>{alternateCarbon(row.per_acre, row.unit) && <><strong>{formatEstimate(alternateCarbon(row.per_acre, row.unit)!.value, 4)}</strong><span>{alternateCarbon(row.per_acre, row.unit)!.unit}/acre</span></>}</td>
                <td>{formatEstimate(row.area_acres)}</td><td>{row.sampling_error_percent ?? "N/A"}%</td><td>{row.plot_count ?? "N/A"}</td>
              </tr>)}</tbody>
            </table>
            <p className="method-note">{result.method_note}</p>
            <ExportButtons result={result} />
          </section>
        </>
      )}
    </div>
  );
}
