const sources = [
  ["FIA FIADB-API / EVALIDator", "Broad-area forest area, volume, biomass, carbon, and sampling errors."],
  ["FIA DataMart / FIADB", "Inventory tables and reference data used for validation and future precomputed summaries."],
  ["FIA documentation", "Definitions, estimation guidance, evaluation groups, attributes, and limitations."],
  ["FCO sample data", "Clearly labeled mock results used only when demonstrating unfinished or unavailable live-data paths."],
];

export function DataSources() {
  return (
    <section className="document-page">
      <h1>Data Sources</h1>
      <p>FCO uses public FIA data and documentation. Every result identifies whether it came from the official FIADB-API, precomputed FIA data, or a clearly labeled sample fallback.</p>
      <div className="source-list">{sources.map(([name, body]) => <article key={name}><h2>{name}</h2><p>{body}</p></article>)}</div>
    </section>
  );
}
