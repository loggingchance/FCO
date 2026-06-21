import { useEffect, useMemo, useState } from "react";
import { GitCompare } from "lucide-react";
import { EstimateChart } from "../components/EstimateChart";
import { ExportButtons } from "../components/ExportButtons";
import { api } from "../services/api";
import type { CountyOption, EstimateRequest, EstimateResponse, StateOption } from "../types";
import { COUNTIES, STATES } from "../../shared/counties.js";
import { alternateCarbon, formatPerAcreEstimate, formatPercent, formatTotalEstimate } from "../utils/units";
import { saveLastResult } from "../utils/results";
import { trackUsage } from "../services/analytics";

const DEFAULT_ESTIMATES = [
  { id: "forest_area", label: "Forest area", unit: "acres" },
  { id: "total_carbon", label: "Total forest carbon", unit: "metric tonnes carbon" },
];
const SAFE_EVALUATION_YEARS = [2023, 2022, 2021, 2020, 2019, 2018];

export function Compare() {
  const [geography, setGeography] = useState<"state" | "county">("state");
  const [states, setStates] = useState<StateOption[]>(STATES);
  const [stateA, setStateA] = useState("WI");
  const [stateB, setStateB] = useState("MI");
  const [countyState, setCountyState] = useState("WI");
  const [counties, setCounties] = useState<CountyOption[]>(COUNTIES.filter((item) => item.state === "WI"));
  const [countyA, setCountyA] = useState("55001");
  const [countyB, setCountyB] = useState("55003");
  const [estimateTypes, setEstimateTypes] = useState(DEFAULT_ESTIMATES);
  const [estimateType, setEstimateType] = useState("total_carbon");
  const [years, setYears] = useState<number[]>(SAFE_EVALUATION_YEARS);
  const [year, setYear] = useState(2023);
  const [yearMessage, setYearMessage] = useState("Loading common FIA evaluation years...");
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.states().then(setStates).catch(() => setStates(STATES));
    api.estimateTypes().then(setEstimateTypes).catch(() => setEstimateTypes(DEFAULT_ESTIMATES));
  }, []);

  useEffect(() => {
    api.counties(countyState).then((items) => {
      setCounties(items);
      setCountyA(items[0]?.fips || "");
      setCountyB(items[1]?.fips || items[0]?.fips || "");
    }).catch(() => {
      const items = COUNTIES.filter((item) => item.state === countyState);
      setCounties(items);
      setCountyA(items[0]?.fips || "");
      setCountyB(items[1]?.fips || items[0]?.fips || "");
    });
  }, [countyState]);

  useEffect(() => {
    const stateCodes = geography === "state" ? [stateA, stateB] : [countyState];
    setYearMessage("Loading common FIA evaluation years...");
    Promise.all(stateCodes.map((code) => api.evaluationYears(code))).then((sets) => {
      const common = sets[0].filter((candidate) => sets.every((set) => set.includes(candidate)));
      if (!common.length) {
        setYears(SAFE_EVALUATION_YEARS);
        setYearMessage("Using recent evaluation years while FIA year availability is refreshed.");
        return;
      }
      setYears(common);
      setYear((current) => common.includes(current) ? current : common[0]);
      setYearMessage("Only evaluation years published for both selected places are shown.");
    }).catch(() => {
      setYears(SAFE_EVALUATION_YEARS);
      setYear((current) => SAFE_EVALUATION_YEARS.includes(current) ? current : SAFE_EVALUATION_YEARS[0]);
      setYearMessage("Using recent evaluation years while FIA year availability is refreshed.");
    });
  }, [geography, stateA, stateB, countyState]);

  const placeNames = useMemo(() => geography === "state"
    ? [states.find((item) => item.code === stateA)?.name || stateA, states.find((item) => item.code === stateB)?.name || stateB]
    : [counties.find((item) => item.fips === countyA)?.name || countyA, counties.find((item) => item.fips === countyB)?.name || countyB],
  [geography, states, stateA, stateB, counties, countyA, countyB]);

  async function compare() {
    if (!year) {
      setError("Select a common FIA evaluation year before comparing places.");
      return;
    }
    const duplicate = geography === "state" ? stateA === stateB : countyA === countyB;
    if (duplicate) {
      setError("Choose two different places to compare.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const requests: EstimateRequest[] = geography === "state"
        ? [stateA, stateB].map((code) => ({ geography: { type: "state", states: [code], counties: [] }, estimate_type: estimateType, filters: {}, grouping: "state", evaluation_year: year, live_data: true }))
        : [countyA, countyB].map((fips) => ({ geography: { type: "county", states: [countyState], counties: [fips] }, estimate_type: estimateType, filters: {}, grouping: "county", evaluation_year: year, live_data: true }));
      const responses = await Promise.all(requests.map((request) => api.estimate(request)));
      const rows = responses.map((response, index) => ({ ...response.rows[0], label: placeNames[index] }));
      const total = rows.reduce((sum, row) => sum + row.total, 0);
      const area = rows.reduce((sum, row) => sum + row.area_acres, 0);
      const combined: EstimateResponse = {
        request: {
          geography: { type: geography === "state" ? "multi_state" : "multi_county", states: geography === "state" ? [stateA, stateB] : [countyState], counties: geography === "county" ? [countyA, countyB] : [] },
          estimate_type: estimateType,
          filters: {},
          grouping: geography,
          evaluation_year: year,
          live_data: true,
        },
        headline: { label: responses[0].headline.label, value: total, unit: rows[0].unit, per_acre: estimateType === "forest_area" ? 1 : total / area },
        rows,
        warnings: [...new Set(responses.flatMap((response) => response.warnings))],
        method_note: `Side-by-side official FIA comparison for ${placeNames.join(" and ")}.`,
        data_source: "USDA Forest Service FIA FIADB-API / EVALIDator",
        source_mode: "live",
        evaluation_year: year,
        generated_at: new Date().toISOString(),
      };
      setResult(combined);
      saveLastResult(combined);
      trackUsage("comparison_generated", { state: geography === "state" ? `${stateA}-${stateB}` : countyState, geography, estimate: estimateType, year });
    } catch (caught) {
      setError(`The official FIA comparison could not be completed: ${caught instanceof Error ? caught.message : "Please try again"}.`);
      trackUsage("comparison_failed", { state: geography === "state" ? `${stateA}-${stateB}` : countyState, geography, estimate: estimateType, year });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="panel wide"><h1>Compare Places</h1><p className="lede">Generate a side-by-side official FIA comparison for two states or two counties.</p></section>
      <section className="panel form-panel wide">
        <h2>Comparison setup</h2>
        <div className="form-grid">
          <fieldset className="geography-mode"><legend>Geography</legend><div><button type="button" className={geography === "state" ? "active" : ""} onClick={() => setGeography("state")}>States</button><button type="button" className={geography === "county" ? "active" : ""} onClick={() => setGeography("county")}>Counties</button></div></fieldset>
          {geography === "county" && <label>State<select value={countyState} onChange={(event) => setCountyState(event.target.value)}>{states.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>}
          {geography === "state" ? <>
            <label>First state<select value={stateA} onChange={(event) => setStateA(event.target.value)}>{states.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
            <label>Second state<select value={stateB} onChange={(event) => setStateB(event.target.value)}>{states.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
          </> : <>
            <label>First county<select value={countyA} onChange={(event) => setCountyA(event.target.value)}>{counties.map((item) => <option key={item.fips} value={item.fips}>{item.name}</option>)}</select></label>
            <label>Second county<select value={countyB} onChange={(event) => setCountyB(event.target.value)}>{counties.map((item) => <option key={item.fips} value={item.fips}>{item.name}</option>)}</select></label>
          </>}
          <label>Estimate type<select value={estimateType} onChange={(event) => setEstimateType(event.target.value)}>{estimateTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>FIA evaluation year<select value={year} onChange={(event) => setYear(Number(event.target.value))}>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select><small className="field-help">{yearMessage}</small></label>
        </div>
        <div className="form-actions form-actions-end"><button className="primary" onClick={compare} disabled={loading}><GitCompare size={17} /> {loading ? "Comparing..." : "Compare Places"}</button></div>
        {error && <p className="request-error" role="alert">{error}</p>}
      </section>
      {result && <>
        <section className="panel wide"><h2>{result.headline.label}</h2><EstimateChart rows={result.rows} /></section>
        <section className="panel wide"><h2>Comparison table</h2><div className="table-scroll"><table><thead><tr><th>Place</th><th>Total</th><th>Per acre</th><th>Area (acres)</th><th>Standard error</th><th>Sampling error</th><th>Plots</th></tr></thead><tbody>{result.rows.map((row) => <tr key={row.label}><td>{row.label}</td><td className="dual-unit-value"><strong>{formatTotalEstimate(row.total, row.unit)}</strong><span>{row.unit}</span>{alternateCarbon(row.total, row.unit) && <><strong>{formatTotalEstimate(alternateCarbon(row.total, row.unit)!.value, alternateCarbon(row.total, row.unit)!.unit)}</strong><span>{alternateCarbon(row.total, row.unit)!.unit}</span></>}</td><td className="dual-unit-value"><strong>{formatPerAcreEstimate(row.per_acre, row.unit)}</strong><span>{row.unit}/acre</span>{alternateCarbon(row.per_acre, row.unit) && <><strong>{formatPerAcreEstimate(alternateCarbon(row.per_acre, row.unit)!.value, alternateCarbon(row.per_acre, row.unit)!.unit)}</strong><span>{alternateCarbon(row.per_acre, row.unit)!.unit}/acre</span></>}</td><td>{row.area_acres.toLocaleString()}</td><td className="dual-unit-value">{row.standard_error == null ? "N/A" : <><strong>{formatTotalEstimate(row.standard_error, row.unit)}</strong><span>{row.unit}</span>{alternateCarbon(row.standard_error, row.unit) && <><strong>{formatTotalEstimate(alternateCarbon(row.standard_error, row.unit)!.value, alternateCarbon(row.standard_error, row.unit)!.unit)}</strong><span>{alternateCarbon(row.standard_error, row.unit)!.unit}</span></>}</>}</td><td>{row.sampling_error_percent == null ? "N/A" : formatPercent(row.sampling_error_percent)}</td><td>{row.plot_count ?? "N/A"}</td></tr>)}</tbody></table></div><ExportButtons result={result} /></section>
      </>}
    </div>
  );
}
