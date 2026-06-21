import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Play } from "lucide-react";
import { EstimateChart } from "../components/EstimateChart";
import { ExportButtons } from "../components/ExportButtons";
import { MapPanel } from "../components/MapPanel";
import { api } from "../services/api";
import type { CountyOption, EstimateRequest, EstimateResponse, StateOption } from "../types";
import { alternateCarbon, formatCompactEstimate, formatEstimate, formatPerAcreEstimate, formatPercent, formatTotalEstimate } from "../utils/units";
import { saveLastResult } from "../utils/results";
import { trackUsage } from "../services/analytics";
import { COUNTIES, STATES } from "../../shared/counties.js";
import { ADVANCED_FILTERS } from "../../shared/fiaOptions.js";

const fallbackStates: StateOption[] = STATES;
const SAFE_EVALUATION_YEARS = [2023, 2022, 2021, 2020, 2019, 2018];

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

const GROUPING_LABELS: Record<string, string> = {
  state: "State total",
  county: "County",
  forest_type_group: "Forest type group",
  ownership_group: "Ownership group",
  stand_size_class: "Stand-size class",
  age_class: "Stand age class",
  reserved_status: "Reserved status",
  carbon_pool: "Carbon pool",
};

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
  const [evaluationYears, setEvaluationYears] = useState<number[]>(SAFE_EVALUATION_YEARS);
  const [yearMessage, setYearMessage] = useState("Loading FIA evaluation years...");
  const [advanced, setAdvanced] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setYearMessage("Loading FIA evaluation years...");
    api.evaluationYears(state).then((years) => {
      if (!years.length) {
        setEvaluationYears(SAFE_EVALUATION_YEARS);
        setYearMessage("Using recent evaluation years while FIA year availability is refreshed.");
        return;
      }
      setEvaluationYears(years);
      setEvaluationYear((current) => years.includes(current) ? current : years[0]);
      setYearMessage("Years are state-specific FIA evaluation groups and may lag the current calendar year.");
    }).catch(() => {
      setEvaluationYears(SAFE_EVALUATION_YEARS);
      setEvaluationYear((current) => SAFE_EVALUATION_YEARS.includes(current) ? current : SAFE_EVALUATION_YEARS[0]);
      setYearMessage("Using recent evaluation years while FIA year availability is refreshed.");
    });
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
    if (!evaluationYear) {
      setRequestError("Select an available FIA evaluation year before generating results.");
      return;
    }
    const payload: EstimateRequest = {
      geography: { type: geoType, states: [state], counties: geoType === "county" ? [county] : [] },
      estimate_type: estimateType,
      grouping,
      evaluation_year: evaluationYear,
      live_data: true,
      filters: advanced ? Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) : {},
    };
    setLoading(true);
    setRequestError("");
    try {
      const nextResult = await api.estimate(payload);
      setResult(nextResult);
      saveLastResult(nextResult);
      trackUsage("estimate_generated", { state, geography: geoType, estimate: estimateType, grouping, year: evaluationYear });
    } catch (error) {
      setResult(null);
      const detail = error instanceof Error ? error.message.replace(/[.\s]+$/, "") : "Please try again";
      setRequestError(`The official FIA request could not be completed: ${detail}.`);
      trackUsage("estimate_failed", { state, geography: geoType, estimate: estimateType, grouping, year: evaluationYear });
    } finally {
      setLoading(false);
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
            <small className="field-help">{yearMessage}</small>
          </label>
        </div>
        <p className="official-data-note"><strong>Official FIA/EVALIDator data</strong><span>Results are requested directly from the USDA Forest Service FIA service.</span></p>
        <div className="form-actions">
          <button className="link-button advanced-toggle" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
            {advanced ? "Hide advanced filters" : "Advanced filters"}<ChevronDown size={16} className={advanced ? "open" : ""} />
          </button>
          <button className="primary" onClick={generate} disabled={loading}><Play size={17} /> {loading ? "Generating..." : "Generate Results"}</button>
        </div>
        {requestError && <p className="request-error" role="alert">{requestError}</p>}
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
              <span>{result.headline.label}</span><strong title={formatTotalEstimate(result.headline.value, result.headline.unit)}>{formatCompactEstimate(result.headline.value)}</strong><em>{result.headline.unit}</em>
              {alternateCarbon(result.headline.value, result.headline.unit) && <small title={formatTotalEstimate(alternateCarbon(result.headline.value, result.headline.unit)!.value, alternateCarbon(result.headline.value, result.headline.unit)!.unit)}>{formatCompactEstimate(alternateCarbon(result.headline.value, result.headline.unit)!.value)} {alternateCarbon(result.headline.value, result.headline.unit)!.unit}</small>}
            </article>
            <article>
              <span>Per acre</span><strong>{formatPerAcreEstimate(result.headline.per_acre, result.headline.unit)}</strong><em>{result.headline.unit}/acre</em>
              {alternateCarbon(result.headline.per_acre, result.headline.unit) && <small>{formatPerAcreEstimate(alternateCarbon(result.headline.per_acre, result.headline.unit)!.value, alternateCarbon(result.headline.per_acre, result.headline.unit)!.unit)} {alternateCarbon(result.headline.per_acre, result.headline.unit)!.unit}/acre</small>}
            </article>
            <article>
              <span>Standard error</span>
              <strong title={result.rows.length === 1 && result.rows[0]?.standard_error != null ? formatTotalEstimate(result.rows[0].standard_error, result.rows[0].unit) : undefined}>{result.rows.length === 1 && result.rows[0]?.standard_error != null ? formatCompactEstimate(result.rows[0].standard_error) : "By row"}</strong>
              <em>{result.rows.length === 1 && result.rows[0]?.standard_error != null ? result.rows[0].unit : "See results table"}</em>
              {result.rows.length === 1 && result.rows[0]?.standard_error != null && alternateCarbon(result.rows[0].standard_error, result.rows[0].unit) && <small title={formatTotalEstimate(alternateCarbon(result.rows[0].standard_error, result.rows[0].unit)!.value, alternateCarbon(result.rows[0].standard_error, result.rows[0].unit)!.unit)}>{formatCompactEstimate(alternateCarbon(result.rows[0].standard_error, result.rows[0].unit)!.value)} {alternateCarbon(result.rows[0].standard_error, result.rows[0].unit)!.unit}</small>}
            </article>
            <article><span>Sampling error</span><strong>{result.rows.length === 1 && result.rows[0]?.sampling_error_percent != null ? formatPercent(result.rows[0].sampling_error_percent) : "By row"}</strong><em>{result.rows.length === 1 ? "FIA estimate" : "See results table"}</em></article>
            <article><span>Contributing plots</span><strong>{result.rows.length === 1 && result.rows[0]?.plot_count != null ? result.rows[0].plot_count.toLocaleString() : result.rows.length === 1 ? "N/A" : "By row"}</strong><em>{result.rows.length === 1 ? "FIA plots" : "See results table"}</em></article>
            <article><span>Data status</span><strong className="status-value">{result.source_mode === "live" ? "Official FIA" : "Illustrative data"}</strong><em>{result.evaluation_year || "sample data"}</em></article>
          </section>
          <section className="panel"><h2>Chart</h2><EstimateChart rows={result.rows} /></section>
          <section className="panel"><h2>Map</h2><MapPanel stateCode={state} label={geoType === "county" ? selectedCountyName : states.find((item) => item.code === state)?.name || state} /></section>
          <section className="panel wide">
            <h2>Table and exports</h2>
            <p className="result-context"><strong>Grouped by:</strong> {GROUPING_LABELS[result.request.grouping || result.request.geography.type] || result.request.grouping} <span>FIA evaluation year: {result.evaluation_year || "N/A"}</span></p>
            <div className="warnings">{result.warnings.map((warning) => <p key={warning}><AlertTriangle size={16} /> {warning}</p>)}</div>
            <div className="table-scroll"><table>
              <thead><tr><th>Place</th><th>Total</th><th>Per acre</th><th>Area (acres)</th><th>Standard error</th><th>Sampling error (%)</th><th>Plots (count)</th></tr></thead>
              <tbody>{result.rows.map((row) => <tr key={row.label}>
                <td>{row.label}</td>
                <td className="dual-unit-value"><strong>{formatTotalEstimate(row.total, row.unit)}</strong><span>{row.unit}</span>{alternateCarbon(row.total, row.unit) && <><strong>{formatTotalEstimate(alternateCarbon(row.total, row.unit)!.value, alternateCarbon(row.total, row.unit)!.unit)}</strong><span>{alternateCarbon(row.total, row.unit)!.unit}</span></>}</td>
                <td className="dual-unit-value"><strong>{formatPerAcreEstimate(row.per_acre, row.unit)}</strong><span>{row.unit}/acre</span>{alternateCarbon(row.per_acre, row.unit) && <><strong>{formatPerAcreEstimate(alternateCarbon(row.per_acre, row.unit)!.value, alternateCarbon(row.per_acre, row.unit)!.unit)}</strong><span>{alternateCarbon(row.per_acre, row.unit)!.unit}/acre</span></>}</td>
                <td>{formatEstimate(row.area_acres)}</td>
                <td className="dual-unit-value">{row.standard_error == null ? "N/A" : <><strong>{formatTotalEstimate(row.standard_error, row.unit)}</strong><span>{row.unit}</span>{alternateCarbon(row.standard_error, row.unit) && <><strong>{formatTotalEstimate(alternateCarbon(row.standard_error, row.unit)!.value, alternateCarbon(row.standard_error, row.unit)!.unit)}</strong><span>{alternateCarbon(row.standard_error, row.unit)!.unit}</span></>}</>}</td>
                <td>{row.sampling_error_percent == null ? "N/A" : formatPercent(row.sampling_error_percent)}</td><td>{row.plot_count ?? "N/A"}</td>
              </tr>)}</tbody>
            </table></div>
            <p className="method-note">{result.method_note}</p>
            <ExportButtons result={result} />
          </section>
        </>
      )}
    </div>
  );
}
