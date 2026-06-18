import { Download, FileDown } from "lucide-react";
import type { EstimateResponse } from "../types";
import { api } from "../services/api";

function toCsv(result: EstimateResponse) {
  const header = ["label", "total", "per_acre", "area_acres", "sampling_error_percent", "unit"];
  const lines = result.rows.map((row) =>
    [row.label, row.total, row.per_acre, row.area_acres, row.sampling_error_percent ?? "", row.unit].join(","),
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

export function ExportButtons({ result }: { result: EstimateResponse }) {
  async function downloadReport(format: "html" | "pdf") {
    const res = await fetch(api.reportUrl(format), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    const blob = await res.blob();
    download(`fco-report.${format}`, blob, format === "pdf" ? "application/pdf" : "text/html");
  }

  return (
    <div className="actions">
      <button onClick={() => download("fco-estimate.csv", toCsv(result), "text/csv")}><Download size={16} /> CSV</button>
      <button onClick={() => downloadReport("html")}><FileDown size={16} /> HTML report</button>
      <button onClick={() => downloadReport("pdf")}><FileDown size={16} /> PDF report</button>
    </div>
  );
}

