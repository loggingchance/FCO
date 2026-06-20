export function Methodology() {
  return (
    <section className="document-page">
      <h1>Methodology</h1>
      <p>FCO is designed as a transparent reporting layer over broad-area FIA/EVALIDator estimates. Generated estimates and comparisons use the official FIADB-API and retain the returned uncertainty and plot-count information.</p>
      <h2>Core rules</h2>
      <ul>
        <li>FCO reports current broad-area FIA estimates for counties, states, and regions.</li>
        <li>Every result identifies its evaluation year, source, units, sampling error, and reliability warnings when available.</li>
        <li>Filters and groupings are enabled only after their FIADB-API mappings are validated.</li>
        <li>FCO does not project management scenarios or replace local stand inventories.</li>
        <li>Every export preserves methods, limitations, data-source notes, and warning flags.</li>
      </ul>
    </section>
  );
}
