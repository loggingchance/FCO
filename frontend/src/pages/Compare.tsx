import { EstimateChart } from "../components/EstimateChart";
import { MapPanel } from "../components/MapPanel";

const rows = [
  { label: "Wisconsin", total: 1280000000, per_acre: 74.9, area_acres: 17100000, sampling_error_percent: 4.8, unit: "tons CO2e" },
  { label: "Michigan", total: 1630000000, per_acre: 78.1, area_acres: 20900000, sampling_error_percent: 4.2, unit: "tons CO2e" },
  { label: "Minnesota", total: 1120000000, per_acre: 70.3, area_acres: 15900000, sampling_error_percent: 5.1, unit: "tons CO2e" },
];

export function Compare() {
  return (
    <div className="page-grid">
      <section className="panel wide"><h1>Compare Places</h1><p className="lede">Compare states, counties, forest type groups, ownership groups, and carbon pools with consistent warning language.</p></section>
      <section className="panel"><h2>Regional comparison</h2><EstimateChart rows={rows} /></section>
      <section className="panel"><h2>Map comparison</h2><MapPanel stateCode="WI" label="Wisconsin" /></section>
      <section className="panel wide">
        <h2>Ranking table</h2>
        <table><thead><tr><th>Place</th><th>Total carbon</th><th>Carbon per acre</th><th>Sampling error</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.total.toLocaleString()}</td><td>{row.per_acre}</td><td>{row.sampling_error_percent}%</td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
