export function Reports() {
  return (
    <section className="document-page">
      <h1>Reports</h1>
      <p className="lede">FCO reports combine estimates, charts, tables, methods, warnings, limitations, and the COLE tribute note into a plain-English export.</p>
      <article className="report-preview">
        <p className="eyebrow">Sample report preview</p>
        <h2>Forest Carbon Summary: Wisconsin</h2>
        <p>This beta sample summarizes forest area, total carbon stock, carbon per acre, and selected pool estimates for a broad public audience.</p>
        <div className="report-columns"><span>Total carbon: 1.28B tons CO2e</span><span>Forest area: 17.1M acres</span><span>Sampling error: 4.8%</span></div>
        <p className="warning-text">This report is not a stand-level, parcel-level, offset-ready, or official USDA Forest Service estimate.</p>
      </article>
    </section>
  );
}

