import { Download, FileDown, Printer } from "lucide-react";
import type { EstimateResponse } from "../types";

function toCsv(result: EstimateResponse) {
  const header = ["label", "total", "per_acre", "area_acres", "sampling_error_percent", "plot_count", "unit"];
  const lines = result.rows.map((row) =>
    [row.label, row.total, row.per_acre, row.area_acres, row.sampling_error_percent ?? "", row.plot_count ?? "", row.unit].join(","),
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

function toHtml(result: EstimateResponse) {
  const rows = result.rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.label)}</td>
      <td>${row.total.toLocaleString()}</td>
      <td>${row.per_acre.toLocaleString()}</td>
      <td>${row.area_acres.toLocaleString()}</td>
      <td>${row.sampling_error_percent ?? "N/A"}</td>
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
<h2>${escapeHtml(result.headline.label)}</h2>
<p><strong>${result.headline.value.toLocaleString()} ${escapeHtml(result.headline.unit)}</strong></p>
<p>Per acre: ${result.headline.per_acre.toLocaleString()} ${escapeHtml(result.headline.unit)}/acre</p>
<table><thead><tr><th>Place</th><th>Total (${escapeHtml(result.headline.unit)})</th><th>Per acre (${escapeHtml(result.headline.unit)}/acre)</th><th>Area (acres)</th><th>Sampling error (%)</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Method and data source</h2><p>${escapeHtml(result.method_note)}</p><p>${escapeHtml(result.data_source)}</p>
<h2>Important notes</h2><ul class="warning">${warnings}</ul>
</body></html>`;
}

export function ExportButtons({ result }: { result: EstimateResponse }) {
  return (
    <div className="actions">
      <button onClick={() => download("fco-estimate.csv", toCsv(result), "text/csv")}><Download size={16} /> CSV</button>
      <button onClick={() => download("fco-report.html", toHtml(result), "text/html")}><FileDown size={16} /> HTML report</button>
      <button onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</button>
    </div>
  );
}
