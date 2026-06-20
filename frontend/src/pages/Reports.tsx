import { useState } from "react";
import { FileText } from "lucide-react";
import { ExportButtons } from "../components/ExportButtons";
import type { Page } from "../types";
import { loadLastResult } from "../utils/results";
import { alternateCarbon, formatPerAcreEstimate, formatPercent, formatTotalEstimate } from "../utils/units";

export function Reports({ setPage }: { setPage: (page: Page) => void }) {
  const [result] = useState(loadLastResult);

  if (!result) {
    return <section className="document-page"><h1>Reports</h1><p className="lede">Generate an official FIA estimate or comparison first. FCO will keep the latest result here for reporting and export.</p><button className="primary" onClick={() => setPage("explore")}><FileText size={17} /> Create a Report</button></section>;
  }

  const grouping = (result.request.grouping || result.request.geography.type).replaceAll("_", " ");
  return (
    <section className="document-page report-document">
      <p className="eyebrow">Latest generated result</p>
      <h1>FCO Forest Carbon Report</h1>
      <p className="lede">{result.headline.label}</p>
      <div className="report-columns"><span>Total: {formatTotalEstimate(result.headline.value, result.headline.unit)} {result.headline.unit}{alternateCarbon(result.headline.value, result.headline.unit) && <small>{formatTotalEstimate(alternateCarbon(result.headline.value, result.headline.unit)!.value, alternateCarbon(result.headline.value, result.headline.unit)!.unit)} {alternateCarbon(result.headline.value, result.headline.unit)!.unit}</small>}</span><span>Per acre: {formatPerAcreEstimate(result.headline.per_acre, result.headline.unit)} {result.headline.unit}/acre{alternateCarbon(result.headline.per_acre, result.headline.unit) && <small>{formatPerAcreEstimate(alternateCarbon(result.headline.per_acre, result.headline.unit)!.value, alternateCarbon(result.headline.per_acre, result.headline.unit)!.unit)} {alternateCarbon(result.headline.per_acre, result.headline.unit)!.unit}/acre</small>}</span><span>Grouped by: {grouping}</span><span>FIA evaluation year: {result.evaluation_year ?? "N/A"}</span></div>
      <h2>Results</h2>
      <div className="table-scroll"><table><thead><tr><th>Place or group</th><th>Total</th><th>Per acre</th><th>Sampling error</th><th>Plots</th></tr></thead><tbody>{result.rows.map((row) => <tr key={row.label}><td>{row.label}</td><td className="dual-unit-value"><strong>{formatTotalEstimate(row.total, row.unit)}</strong><span>{row.unit}</span>{alternateCarbon(row.total, row.unit) && <><strong>{formatTotalEstimate(alternateCarbon(row.total, row.unit)!.value, alternateCarbon(row.total, row.unit)!.unit)}</strong><span>{alternateCarbon(row.total, row.unit)!.unit}</span></>}</td><td className="dual-unit-value"><strong>{formatPerAcreEstimate(row.per_acre, row.unit)}</strong><span>{row.unit}/acre</span>{alternateCarbon(row.per_acre, row.unit) && <><strong>{formatPerAcreEstimate(alternateCarbon(row.per_acre, row.unit)!.value, alternateCarbon(row.per_acre, row.unit)!.unit)}</strong><span>{alternateCarbon(row.per_acre, row.unit)!.unit}/acre</span></>}</td><td>{row.sampling_error_percent == null ? "N/A" : formatPercent(row.sampling_error_percent)}</td><td>{row.plot_count ?? "N/A"}</td></tr>)}</tbody></table></div>
      <h2>Method and source</h2><p>{result.method_note}</p><p>{result.data_source}</p>
      {result.warnings.length > 0 && <><h2>Important notes</h2><ul className="warning-text">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></>}
      <ExportButtons result={result} />
    </section>
  );
}
