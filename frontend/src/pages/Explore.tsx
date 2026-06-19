import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Play } from "lucide-react";
import { EstimateChart } from "../components/EstimateChart";
import { ExportButtons } from "../components/ExportButtons";
import { MapPanel } from "../components/MapPanel";
import { api } from "../services/api";
import type { CountyOption, EstimateRequest, EstimateResponse, StateOption } from "../types";

const fallbackStates: StateOption[] = [
  { code: "WI", name: "Wisconsin" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "NY", name: "New York" },
  { code: "VT", name: "Vermont" },
  { code: "ME", name: "Maine" },
];

const fallbackEstimateTypes = [
  { id: "forest_area", label: "Forest area", unit: "acres" },
  { id: "total_carbon", label: "Total carbon stock", unit: "metric tonnes carbon" },
];

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
  const isArea = request.estimate_type === "forest_area";
  const value = isArea ? sample.area : sample.carbon;
  const unit = isArea ? "acres" : "metric tonnes carbon";
  const perAcre = isArea ? 1 : value / sample.area;

  return {
    request,
    headline: { label: isArea ? "Forest area" : "Total forest carbon", value, unit, per_acre: perAcre },
    rows: [{
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
  const [liveData, setLiveData] = useState(true);
  const [advanced, setAdvanced] = useState(false);
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
    }).catch(() => undefined);
  }, [state]);

  const selectedCountyName = useMemo(() => counties.find((item) => item.fips === county)?.name || "Selected county", [counties, county]);

  async function generate() {
    const payload: EstimateRequest = {
      geography: { type: geoType, states: [state], counties: geoType === "county" ? [county] : [] },
      estimate_type: estimateType,
      grouping,
      evaluation_year: evaluationYear,
      live_data: liveData,
      filters: advanced ? { ownership_group: "All ownerships", stand_size_class: "All stand sizes" } : {},
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
          <label>
            Geography
            <select value={geoType} onChange={(e) => setGeoType(e.target.value as "state" | "county")}>
              <option value="state">State</option>
              <option value="county">County</option>
            </select>
          </label>
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
            <select value={estimateType} onChange={(e) => setEstimateType(e.target.value)}>
              {estimateTypes.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Group results by
            <select value={grouping} onChange={(e) => setGrouping(e.target.value)}>
              {["county", "state", "carbon_pool", "forest_type_group", "ownership_group", "stand_size_class", "age_class", "reserved_status"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label>
            FIA evaluation year
            <select value={evaluationYear} onChange={(e) => setEvaluationYear(Number(e.target.value))}>
              {[2024, 2023, 2022, 2021, 2020].map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={liveData} onChange={(e) => setLiveData(e.target.checked)} />
          Request official FIA/EVALIDator data
        </label>
        <button className="link-button" onClick={() => setAdvanced(!advanced)}>{advanced ? "Hide advanced filters" : "Advanced filters"}</button>
        {advanced && (
          <div className="filter-row">
            <span>Forest type group: All</span>
            <span>Ownership group: All</span>
            <span>Stand-size class: All</span>
            <span>Reserved status: All</span>
          </div>
        )}
        <button className="primary" onClick={generate}><Play size={17} /> Generate Results</button>
      </section>
      {result && (
        <>
          <section className="result-cards wide">
            <article><span>{result.headline.label}</span><strong>{result.headline.value.toLocaleString()}</strong><em>{result.headline.unit}</em></article>
            <article><span>Per acre</span><strong>{result.headline.per_acre.toLocaleString()}</strong><em>{result.headline.unit}/acre</em></article>
            <article><span>Sampling error</span><strong>{result.rows[0]?.sampling_error_percent ?? "N/A"}%</strong><em>{result.source_mode === "live" ? "FIA estimate" : "illustrative"}</em></article>
            <article><span>Data status</span><strong className="status-value">{result.source_mode === "live" ? "Official FIA" : "Illustrative data"}</strong><em>{result.evaluation_year || "sample data"}</em></article>
          </section>
          <section className="panel"><h2>Chart</h2><EstimateChart rows={result.rows} /></section>
          <section className="panel"><h2>Map</h2><MapPanel stateCode={state} label={geoType === "county" ? selectedCountyName : states.find((item) => item.code === state)?.name || state} /></section>
          <section className="panel wide">
            <h2>Table and exports</h2>
            <div className="warnings">{result.warnings.map((warning) => <p key={warning}><AlertTriangle size={16} /> {warning}</p>)}</div>
            <table>
              <thead><tr><th>Place</th><th>Total ({result.headline.unit})</th><th>Per acre ({result.headline.unit}/acre)</th><th>Area (acres)</th><th>Sampling error (%)</th><th>Plots (count)</th></tr></thead>
              <tbody>{result.rows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.total.toLocaleString()}</td><td>{row.per_acre.toLocaleString()}</td><td>{row.area_acres.toLocaleString()}</td><td>{row.sampling_error_percent ?? "N/A"}%</td><td>{row.plot_count ?? "N/A"}</td></tr>)}</tbody>
            </table>
            <p className="method-note">{result.method_note}</p>
            <ExportButtons result={result} />
            <p className="report-support">Enjoying FCO? <a href="https://venmo.com/u/Steven-Bick-1" target="_blank" rel="noreferrer">Buy me a coffee</a>.</p>
          </section>
        </>
      )}
    </div>
  );
}
