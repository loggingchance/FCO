import { ArrowRight, FileText, Filter, History, Layers3, MapPin, Search } from "lucide-react";
import type { Page } from "../types";

const pools = [
  ["Live tree", 46],
  ["Soil organic", 31],
  ["Down dead wood", 9],
  ["Standing dead", 7],
  ["Litter", 7],
] as const;

export function Home({ setPage }: { setPage: (page: Page) => void }) {
  const features: Array<{ title: string; body: string; page: Page; icon: React.ComponentType<{ size?: number }> }> = [
    { title: "Pick a place", body: "Choose a state, county, or region.", page: "explore", icon: MapPin },
    { title: "Choose forest filters", body: "Explore ownership, stand size, and FIA-based categories.", page: "explore", icon: Filter },
    { title: "View carbon pools", body: "Compare live tree, dead wood, litter, soil, and total carbon.", page: "explore", icon: Layers3 },
    { title: "Export a report", body: "Create a plain-English summary with methods and limitations.", page: "reports", icon: FileText },
  ];

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">FIA public data explorer</p>
        <h1 className="home-task-title">Choose a place. Build an estimate.</h1>
        <p className="lede">Select a state or county, choose the forest carbon measure you need, and generate a documented result with maps, tables, and exports.</p>
        <div className="home-scope-grid" aria-label="Explorer coverage">
          <div><strong>50 states + DC</strong><span>Nationwide coverage</span></div>
          <div><strong>3,143</strong><span>Counties and equivalents</span></div>
          <div><strong>FIA uncertainty</strong><span>Error and plot counts</span></div>
        </div>
        <div className="home-primary-actions">
          <button className="primary" onClick={() => setPage("explore")}>Choose a Place <ArrowRight size={17} /></button>
        </div>
        <div className="home-secondary-actions">
          <button onClick={() => setPage("reports")}><FileText size={17} /> Latest Report</button>
          <button onClick={() => setPage("history")}><History size={17} /> History</button>
          <button onClick={() => setPage("methodology")}><Search size={17} /> Method</button>
        </div>
        <p className="scale-warning">For county, state, and regional estimates. Not a parcel-level or stand-level carbon calculator.</p>
      </div>

      <div className="home-dashboard" aria-label="Illustrative Wisconsin forest carbon preview">
        <div className="dashboard-context"><strong>Wisconsin</strong><span>Illustrative 2023 sample</span></div>
        <div className="metric-grid">
          <div className="metric"><span>Total carbon</span><strong>1.28B</strong><em>metric tonnes carbon</em></div>
          <div className="metric"><span>Forest area</span><strong>17.1M</strong><em>acres</em></div>
        </div>
        <figure className="pool-preview">
          <figcaption><strong>Share by carbon pool</strong><span>Percent of illustrative total</span></figcaption>
          {pools.map(([label, share]) => (
            <div className="pool-row" key={label}>
              <span>{label}</span><i><b style={{ width: `${share}%` }} /></i><strong>{share}%</strong>
            </div>
          ))}
        </figure>
      </div>

      <div className="feature-grid">
        {features.map(({ title, body, page, icon: Icon }) => (
          <button className="feature-link" key={title} onClick={() => setPage(page)}>
            <Icon size={22} />
            <span><strong>{title}</strong><small>{body}</small></span>
            <ArrowRight size={17} className="feature-arrow" />
          </button>
        ))}
      </div>
    </section>
  );
}
