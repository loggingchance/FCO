const sources = [
  ["FIA FIADB-API / EVALIDator", "Broad-area forest area, volume, biomass, carbon, and sampling errors."],
  ["FIA DataMart / FIADB", "Inventory tables and reference data used for validation and future precomputed summaries."],
  ["FIA documentation", "Definitions, estimation guidance, evaluation groups, attributes, and limitations."],
  ["U.S. Census Bureau TIGERweb", "Official county boundary geometry used for county result maps."],
  ["FCO interface data", "State and county selector lists, labels, and display metadata packaged with the application."],
];

export function DataSources() {
  return (
    <section className="document-page">
      <h1>Data Sources</h1>
      <p>FCO uses public FIA data and documentation. Generated production results identify the official FIADB-API source, evaluation year, uncertainty, and contributing plot count when returned by FIA.</p>
      <div className="source-list">{sources.map(([name, body]) => <article key={name}><h2>{name}</h2><p>{body}</p></article>)}</div>
    </section>
  );
}
