import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Play } from "lucide-react";
import { DecisionWizard } from "../components/DecisionWizard";
import { EstimateChart } from "../components/EstimateChart";
import { ExportButtons } from "../components/ExportButtons";
import { MapPanel } from "../components/MapPanel";
import { api } from "../services/api";
import type { CountyOption, EstimateRequest, EstimateResponse, StateOption } from "../types";

export function Explore() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [counties, setCounties] = useState<CountyOption[]>([]);
  const [estimateTypes, setEstimateTypes] = useState<{ id: string; label: string; unit: string }[]>([]);
  const [state, setState] = useState("WI");
  const [county, setCounty] = useState("");
  const [geoType, setGeoType] = useState<"state" | "county">("state");
  const [estimateType, setEstimateType] = useState("total_carbon");
  const [grouping, setGrouping] = useState("county");
  const [advanced, setAdvanced] = useState(false);
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.states().then(setStates).catch(() => setError("Backend is not available yet. Start the API or use the mock build after install."));
    api.estimateTypes().then(setEstimateTypes).catch(() => undefined);
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
      filters: advanced ? { ownership_group: "All ownerships", stand_size_class: "All stand sizes" } : {},
    };
    setResult(await api.estimate(payload));
  }

  return (
    <div className="page-grid">
      <section className="panel wide">
        <h1>Explore Carbon</h1>
        <p className="lede">Generate broad-area FIA-style estimates for states, counties, and regions. Results are normalized for cards, charts, tables, maps, and report exports.</p>
      </section>
      <DecisionWizard />
      <section className="panel form-panel">
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
        </div>
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
        {error && <p className="warning-text">{error}</p>}
      </section>
      {result && (
        <>
          <section className="result-cards wide">
            <article><span>{result.headline.label}</span><strong>{result.headline.value.toLocaleString()}</strong><em>{result.headline.unit}</em></article>
            <article><span>Per acre</span><strong>{result.headline.per_acre.toLocaleString()}</strong><em>{result.headline.unit}/acre</em></article>
            <article><span>Sampling error</span><strong>{result.rows[0]?.sampling_error_percent ?? "N/A"}%</strong><em>mock beta flag</em></article>
          </section>
          <section className="panel"><h2>Chart</h2><EstimateChart rows={result.rows} /></section>
          <section className="panel"><h2>Map</h2><MapPanel label={geoType === "county" ? selectedCountyName : state} /></section>
          <section className="panel wide">
            <h2>Table and exports</h2>
            <div className="warnings">{result.warnings.map((warning) => <p key={warning}><AlertTriangle size={16} /> {warning}</p>)}</div>
            <table>
              <thead><tr><th>Label</th><th>Total</th><th>Per acre</th><th>Area acres</th><th>Sampling error</th></tr></thead>
              <tbody>{result.rows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.total.toLocaleString()}</td><td>{row.per_acre.toLocaleString()}</td><td>{row.area_acres.toLocaleString()}</td><td>{row.sampling_error_percent ?? "N/A"}%</td></tr>)}</tbody>
            </table>
            <p className="method-note">{result.method_note}</p>
            <ExportButtons result={result} />
          </section>
        </>
      )}
    </div>
  );
}

