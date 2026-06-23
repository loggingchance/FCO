import { BookOpen, FileText, GitCompare, Map, ShieldAlert } from "lucide-react";
import { NON_AFFILIATION } from "../data/content";
import type { Page } from "../types";

export function HowTo({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <section className="document-page">
      <h1>How to use Forest Carbon Online</h1>
      <p>
        FCO turns official USDA Forest Service FIA estimates into readable tables, charts, maps, and exportable reports for states and counties.
        It is a broad-area explorer, not a parcel-level or stand-level carbon calculator.
      </p>

      <h2>Before you start: what FCO is and is not</h2>
      <ul>
        <li>FCO reports broad-area FIA estimates for a selected state or county and evaluation year.</li>
        <li>Every result carries its source, units, evaluation year, sampling error, standard error, and plot counts when FIA returns them.</li>
        <li>FCO never substitutes modeled or illustrative numbers. A failed FIA request shows an error, not a guess.</li>
        <li>FCO does not project management scenarios or replace a local stand inventory.</li>
      </ul>

      <h2>Step 1: Pick a place</h2>
      <p>Open Explore and use the Estimate setup panel.</p>
      <ol>
        <li>Choose a geography type: state total or county.</li>
        <li>Select the state, and select the county if you chose county.</li>
        <li>Pick a requested FIA evaluation year. Years are state-specific FIA evaluation groups and may lag the current calendar year.</li>
      </ol>
      <button className="primary compact" onClick={() => setPage("explore")}><Map size={17} /> Open Explore</button>

      <h2>Step 2: Choose what to measure</h2>
      <p>
        Use Estimate type to choose forest area, total forest carbon, growing-stock volume, or an individual carbon pool: live tree, standing dead tree,
        live aboveground, live belowground, dead wood, litter, or soil organic carbon.
      </p>
      <p>FCO shows the units returned for each measure: metric tonnes of elemental carbon for carbon, acres for area, and cubic feet for volume.</p>

      <h2>Step 3: Group your results, if needed</h2>
      <p>
        Grouping breaks the estimate into rows. Available groupings include the selected place total, county when a state is selected, forest type group,
        ownership group, stand-size class, stand age class, reserved status, and carbon pool when total forest carbon is selected.
      </p>

      <h2>Step 4: Read the result</h2>
      <p>
        The headline cards show the total, per-acre value, uncertainty, contributing plots, and data status. The table keeps the full row-level detail,
        and the chart gives a quick visual check of grouped rows.
      </p>
      <p>
        Low plot counts and high sampling error are reliability signals. Carry the uncertainty figures forward whenever you cite a number.
      </p>
      <button className="compact" onClick={() => setPage("limitations")}><ShieldAlert size={17} /> Read Limitations</button>

      <h2>Step 5: Compare two places</h2>
      <p>Use Compare Places to select two states or counties and view official FIA estimates side by side.</p>
      <button className="compact" onClick={() => setPage("compare")}><GitCompare size={17} /> Open Compare</button>

      <h2>Step 6: Export a documented report</h2>
      <p>
        After you generate an estimate or comparison, export it from the result page or Reports page. Exports preserve methods, limitations,
        data-source notes, uncertainty values, plot counts, and warning flags so the report is self-documenting.
      </p>
      <button className="compact" onClick={() => setPage("reports")}><FileText size={17} /> Open Reports</button>

      <h2>Tips and good practice</h2>
      <ul>
        <li>Use FCO for county-scale and state-scale questions, not parcel decisions.</li>
        <li>Always include the uncertainty figures when sharing an FIA estimate.</li>
        <li>Check the Glossary for unfamiliar terms and Data Sources for provenance.</li>
      </ul>

      <div className="home-secondary-actions" aria-label="How To quick links">
        <button onClick={() => setPage("explore")}><Map size={17} /> Explore</button>
        <button onClick={() => setPage("compare")}><GitCompare size={17} /> Compare</button>
        <button onClick={() => setPage("reports")}><FileText size={17} /> Reports</button>
        <button onClick={() => setPage("glossary")}><BookOpen size={17} /> Glossary</button>
        <button onClick={() => setPage("limitations")}><ShieldAlert size={17} /> Limitations</button>
      </div>

      <p>{NON_AFFILIATION}</p>
    </section>
  );
}
