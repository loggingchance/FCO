export function Methodology() {
  return (
    <section className="document-page">
      <h1>Methodology</h1>
      <p>FCO is designed as a transparent reporting layer over broad-area FIA/EVALIDator estimates. Generated state and county estimates and comparisons use the official FIADB-API and retain the returned uncertainty and plot-count information.</p>
      <h2>Core rules</h2>
      <ul>
        <li>FCO reports broad-area FIA estimates for the selected state or county and evaluation year.</li>
        <li>Every result identifies its evaluation year, source, units, sampling error, and reliability warnings when available.</li>
        <li>FCO never substitutes modeled, sample, or illustrative numbers when an official request fails.</li>
        <li>Carbon is displayed primarily as metric tonnes of elemental carbon, with short tons of elemental carbon calculated using 1 metric tonne = 1.10231131 short tons. FCO does not label elemental carbon as CO2e.</li>
        <li>Filters and groupings are enabled only after their FIADB-API mappings are validated.</li>
        <li>FCO does not project management scenarios or replace local stand inventories.</li>
        <li>Every export preserves methods, limitations, data-source notes, and warning flags.</li>
      </ul>
    </section>
  );
}
