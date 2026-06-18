import { ArrowRight, FileText, History, Search } from "lucide-react";
import type { Page } from "../types";

export function Home({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Independent COLE-inspired beta</p>
        <h1>FCO - Forest Carbon Online</h1>
        <p className="subtitle">The COLE Tribute App</p>
        <p className="lede">Explore FIA-based forest carbon estimates for counties, states, and regions through simple maps, charts, tables, and downloadable reports.</p>
        <div className="actions">
          <button className="primary" onClick={() => setPage("explore")}>Start Exploring <ArrowRight size={17} /></button>
          <button onClick={() => setPage("reports")}><FileText size={17} /> View Sample Report</button>
          <button onClick={() => setPage("history")}><History size={17} /> Read the History</button>
          <button onClick={() => setPage("methodology")}><Search size={17} /> Learn the Method</button>
        </div>
        <p className="scale-warning">FCO is best used for county, state, and regional estimates. It is not a parcel-level or stand-level carbon calculator.</p>
      </div>
      <div className="home-dashboard" aria-label="FCO dashboard preview">
        <div className="metric"><span>Total carbon</span><strong>1.28B</strong><em>tons CO2e</em></div>
        <div className="metric"><span>Forest area</span><strong>17.1M</strong><em>acres</em></div>
        <div className="mini-bars"><i /><i /><i /><i /><i /></div>
      </div>
      <div className="feature-grid">
        {[
          ["Pick a place", "Choose a state, county, or region."],
          ["Choose forest filters", "Explore forest type, ownership, stand size, and other FIA-based categories."],
          ["View carbon pools", "See live tree, standing dead, down dead wood, litter, soil, and total carbon where supported."],
          ["Export a report", "Create a plain-English summary with tables, charts, methods, and limitations."],
        ].map(([title, body]) => (
          <article className="feature" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

