import { useState } from "react";
import { Download, FileDown, Printer } from "lucide-react";
import type { EstimateResponse } from "../types";
import { alternateCarbon, formatPerAcreEstimate, formatPercent, formatTotalEstimate, isCarbonUnit, roundPerAcreEstimate, roundTotalEstimate } from "../utils/units";
import { STATES } from "../../shared/counties.js";
import { trackUsage } from "../services/analytics";

function toCsv(result: EstimateResponse) {
  const carbon = isCarbonUnit(result.headline.unit);
  const alternate = alternateCarbon(1, result.headline.unit);
  const suffix = alternate?.unit.startsWith("short") ? "short_tons_carbon" : "metric_tonnes_carbon";
  const header = ["label", "total", "per_acre", "area_acres", "standard_error", "sampling_error_percent", "plot_count", "unit", ...(carbon ? [`total_${suffix}`, `per_acre_${suffix}`, `standard_error_${suffix}`] : [])];
  const lines = result.rows.map((row) =>
    [row.label, roundTotalEstimate(row.total, row.unit), roundPerAcreEstimate(row.per_acre, row.unit), row.area_acres, row.standard_error == null ? "" : roundTotalEstimate(row.standard_error, row.unit), row.sampling_error_percent ?? "", row.plot_count ?? "", row.unit, ...(carbon ? [roundTotalEstimate(alternateCarbon(row.total, row.unit)!.value, alternateCarbon(row.total, row.unit)!.unit), roundPerAcreEstimate(alternateCarbon(row.per_acre, row.unit)!.value, alternateCarbon(row.per_acre, row.unit)!.unit), row.standard_error == null ? "" : roundTotalEstimate(alternateCarbon(row.standard_error, row.unit)!.value, alternateCarbon(row.standard_error, row.unit)!.unit)] : [])].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function download(name: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function toHtml(result: EstimateResponse, identifier: string) {
  const carbon = isCarbonUnit(result.headline.unit);
  const groupedBy = (result.request.grouping || result.request.geography.type).replaceAll("_", " ");
  const rows = result.rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.label)}</td>
      <td>${formatTotalEstimate(row.total, row.unit)} ${escapeHtml(row.unit)}${carbon ? `<br>${formatTotalEstimate(alternateCarbon(row.total, row.unit)!.value, alternateCarbon(row.total, row.unit)!.unit)} ${alternateCarbon(row.total, row.unit)!.unit}` : ""}</td>
      <td>${formatPerAcreEstimate(row.per_acre, row.unit)} ${escapeHtml(row.unit)}/acre${carbon ? `<br>${formatPerAcreEstimate(alternateCarbon(row.per_acre, row.unit)!.value, alternateCarbon(row.per_acre, row.unit)!.unit)} ${alternateCarbon(row.per_acre, row.unit)!.unit}/acre` : ""}</td>
      <td>${row.area_acres.toLocaleString()}</td>
      <td>${row.standard_error == null ? "N/A" : `${formatTotalEstimate(row.standard_error, row.unit)} ${escapeHtml(row.unit)}${carbon ? `<br>${formatTotalEstimate(alternateCarbon(row.standard_error, row.unit)!.value, alternateCarbon(row.standard_error, row.unit)!.unit)} ${alternateCarbon(row.standard_error, row.unit)!.unit}` : ""}`}</td>
      <td>${row.sampling_error_percent == null ? "N/A" : formatPercent(row.sampling_error_percent)}</td>
      <td>${row.plot_count ?? "N/A"}</td>
    </tr>`).join("");
  const warnings = result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>FCO Forest Carbon Report</title>
<style>
body{max-width:900px;margin:40px auto;padding:0 24px;font:16px/1.5 Arial,sans-serif;color:#18211b}
h1,h2{color:#183d2a}table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{padding:9px;text-align:left;border-bottom:1px solid #d9e0d7}.warning{color:#8d3328}
</style></head><body>
<h1>FCO Forest Carbon Report</h1><p><em>The COLE Tribute App</em></p>
${identifier ? `<p><strong>Report identifier:</strong> ${escapeHtml(identifier)}</p>` : ""}
<h2>${escapeHtml(result.headline.label)}</h2>
<p><strong>Grouped by:</strong> ${escapeHtml(groupedBy)} &nbsp; <strong>FIA evaluation year:</strong> ${result.evaluation_year ?? "N/A"}</p>
<p><strong>${formatTotalEstimate(result.headline.value, result.headline.unit)} ${escapeHtml(result.headline.unit)}</strong></p>
 ${carbon ? `<p><strong>${formatTotalEstimate(alternateCarbon(result.headline.value, result.headline.unit)!.value, alternateCarbon(result.headline.value, result.headline.unit)!.unit)} ${alternateCarbon(result.headline.value, result.headline.unit)!.unit}</strong></p>` : ""}
<p>Per acre: ${formatPerAcreEstimate(result.headline.per_acre, result.headline.unit)} ${escapeHtml(result.headline.unit)}/acre</p>
${carbon ? `<p>Per acre: ${formatPerAcreEstimate(alternateCarbon(result.headline.per_acre, result.headline.unit)!.value, alternateCarbon(result.headline.per_acre, result.headline.unit)!.unit)} ${alternateCarbon(result.headline.per_acre, result.headline.unit)!.unit}/acre</p>` : ""}
<table><thead><tr><th>Place</th><th>Total</th><th>Per acre</th><th>Area (acres)</th><th>Standard error</th><th>Sampling error (%)</th><th>Plots</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Method and data source</h2><p>${escapeHtml(result.method_note)}</p><p>${escapeHtml(result.data_source)}</p>
<h2>Important notes</h2><ul class="warning">${warnings}</ul>
</body></html>`;
}

export function ExportButtons({ result }: { result: EstimateResponse }) {
  const [identifier, setIdentifier] = useState("");
  const stateNames = result.request.geography.states.map((code) => STATES.find((state) => state.code === code)?.name || code);
  const location = result.request.geography.type === "multi_state"
    ? stateNames.join(" vs ")
    : result.request.geography.type === "multi_county"
      ? `${result.rows.map((row) => row.label).join(" vs ")}, ${stateNames[0]}`
      : result.request.geography.type === "county"
        ? `${result.rows[0]?.label || "County"}, ${stateNames[0]}`
        : stateNames.join(" - ") || "FIA area";
  const fileBase = ["FCO", location, identifier.trim(), result.headline.label, result.evaluation_year]
    .filter(Boolean)
    .join(" - ")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  function printReport() {
    trackUsage("export_created", { state: result.request.geography.states.join("-"), estimate: result.request.estimate_type, grouping: result.request.grouping || undefined, year: result.evaluation_year ?? undefined, format: "pdf" });
    const previousTitle = document.title;
    document.title = fileBase;
    window.print();
    document.title = previousTitle;
  }

  return (
    <div className="export-controls">
      <label className="report-identifier-field"><span>Report identifier <small>Optional</small></span><input type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Client, property, or project name" /></label>
      {identifier.trim() && <p className="print-report-identifier"><strong>Report identifier:</strong> {identifier.trim()}</p>}
      <p className="filename-preview"><strong>Filename:</strong> {fileBase}</p>
      <div className="actions">
        <button onClick={() => { trackUsage("export_created", { state: result.request.geography.states.join("-"), estimate: result.request.estimate_type, grouping: result.request.grouping || undefined, year: result.evaluation_year ?? undefined, format: "csv" }); download(`${fileBase}.csv`, toCsv(result), "text/csv"); }}><Download size={16} /> CSV</button>
        <button onClick={() => { trackUsage("export_created", { state: result.request.geography.states.join("-"), estimate: result.request.estimate_type, grouping: result.request.grouping || undefined, year: result.evaluation_year ?? undefined, format: "html" }); download(`${fileBase}.html`, toHtml(result, identifier.trim()), "text/html"); }}><FileDown size={16} /> HTML report</button>
        <button onClick={printReport}><Printer size={16} /> Print / Save PDF</button>
      </div>
    </div>
  );
}
