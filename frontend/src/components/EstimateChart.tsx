import type { EstimateRow } from "../types";
import { alternateCarbon, formatCompactEstimate, formatTotalEstimate } from "../utils/units";

export function EstimateChart({ rows, maxRows = 12 }: { rows: EstimateRow[]; maxRows?: number }) {
  const visibleRows = rows.length > maxRows ? [...rows].sort((a, b) => b.total - a.total).slice(0, maxRows) : rows;
  const max = Math.max(...visibleRows.map((row) => row.total), 1);
  return (
    <div className="chart" aria-label="Estimate bar chart">
      {rows.length > maxRows && <p className="chart-note">Showing the {maxRows} largest groups. The table includes all {rows.length}.</p>}
      {visibleRows.map((row) => (
        <div className="bar-row" key={row.label}>
          <span>{row.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.max(7, (row.total / max) * 100)}%` }} />
          </div>
          <span className="bar-value"><strong title={formatTotalEstimate(row.total, row.unit)}>{formatCompactEstimate(row.total)}</strong>{alternateCarbon(row.total, row.unit) && <small title={formatTotalEstimate(alternateCarbon(row.total, row.unit)!.value, alternateCarbon(row.total, row.unit)!.unit)}>{formatCompactEstimate(alternateCarbon(row.total, row.unit)!.value)} {alternateCarbon(row.total, row.unit)!.unit}</small>}</span>
        </div>
      ))}
    </div>
  );
}
