const sources = [
  ["FIA FIADB-API / EVALIDator", "Broad-area forest area, volume, biomass, carbon, and sampling errors."],
  ["FVS / FVS-ECON", "Stand or representative-stand projections and treatment cash-flow outputs."],
  ["IMPLAN / BEA RIMS II", "Regional jobs, labor income, value added, and output impacts."],
  ["PAD-US and EnviroAtlas", "Public land, protected area, and environmental GIS context."],
  ["County records", "Timber sale, fiscal, recreation, and stakeholder evidence for project studies."],
];

export function DataSources() {
  return (
    <section className="document-page">
      <h1>Data Sources</h1>
      <p>FCO separates data-source adapters by whether they are direct APIs, local model runners, licensed connectors, or manual import workflows.</p>
      <div className="source-list">{sources.map(([name, body]) => <article key={name}><h2>{name}</h2><p>{body}</p></article>)}</div>
    </section>
  );
}

