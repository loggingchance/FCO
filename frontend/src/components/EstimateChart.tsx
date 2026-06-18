import type { EstimateRow } from "../types";

export function EstimateChart({ rows }: { rows: EstimateRow[] }) {
  const max = Math.max(...rows.map((row) => row.total), 1);
  return (
    <div className="chart" aria-label="Estimate bar chart">
      {rows.map((row) => (
        <div className="bar-row" key={row.label}>
          <span>{row.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.max(7, (row.total / max) * 100)}%` }} />
          </div>
          <strong>{row.total.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

