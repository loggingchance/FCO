export function Methodology() {
  return (
    <section className="document-page">
      <h1>Methodology</h1>
      <p>FCO is designed as a transparent reporting layer over broad-area FIA/EVALIDator estimates. State-level forest area and total forest carbon can use the official FIADB-API. The interface visibly distinguishes official results, mock data, and mock fallback results.</p>
      <h2>Core rules</h2>
      <ul>
        <li>County, state, and regional current-stock questions route to FIA/EVALIDator.</li>
        <li>Stand-level management scenarios route to FVS or FVS-ECON.</li>
        <li>Employment, labor income, value added, and output route to IMPLAN or RIMS II.</li>
        <li>Environmental benefits route to specific ecosystem-service or GIS tools.</li>
        <li>Every export must preserve limitations, assumptions, data source notes, and warning flags.</li>
      </ul>
    </section>
  );
}
