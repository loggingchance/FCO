export function Limitations() {
  return (
    <section className="document-page">
      <h1>Limitations</h1>
      <ul>
        <li>FCO Public Explorer is not a stand-level or parcel-level carbon calculator.</li>
        <li>COLE-style FIA estimates are useful for county, state, and multi-state areas, not local inventory substitutes.</li>
        <li>Narrow filters can create unstable estimates when the FIA plot count is low.</li>
        <li>FCO returns no numeric result when FIA does not publish or cannot complete the selected request.</li>
        <li>Current broad-area stocks do not project management outcomes or fluxes.</li>
        <li>Formal carbon accounting, regulatory compliance, legal conclusions, and investment decisions require expert review.</li>
      </ul>
    </section>
  );
}
