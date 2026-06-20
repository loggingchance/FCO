import type { EstimateRow } from "../types";
import { alternateCarbon, formatTotalEstimate } from "../utils/units";

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
          <span className="bar-value"><strong>{formatTotalEstimate(row.total, row.unit)}</strong>{alternateCarbon(row.total, row.unit) && <small>{formatTotalEstimate(alternateCarbon(row.total, row.unit)!.value, alternateCarbon(row.total, row.unit)!.unit)} {alternateCarbon(row.total, row.unit)!.unit}</small>}</span>
        </div>
      ))}
    </div>
  );
}
