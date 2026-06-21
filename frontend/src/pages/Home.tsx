import { ArrowRight, BadgeCheck, Coffee, ExternalLink, FileText, Filter, History, Layers3, MapPin, Search } from "lucide-react";
import type { Page } from "../types";
import { COUNTIES, STATES } from "../../shared/counties.js";
import { trackUsage } from "../services/analytics";

const resultContents = [
  ["Official source", "Every number comes from a completed USDA Forest Service FIADB-API request."],
  ["Evaluation year", "FCO offers only evaluation groups confirmed as available by FIA."],
  ["Uncertainty", "Standard error, sampling error, and contributing plot counts are retained when FIA returns them."],
  ["No substitute data", "If FIA cannot complete a request, FCO shows an error and no estimate."],
] as const;

export function Home({ setPage }: { setPage: (page: Page) => void }) {
  const features: Array<{ title: string; body: string; page: Page; icon: React.ComponentType<{ size?: number }> }> = [
    { title: "Pick a place", body: "Choose a state or county.", page: "explore", icon: MapPin },
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
          <div><strong>{STATES.length - 1} states + DC</strong><span>Packaged state selectors</span></div>
          <div><strong>{COUNTIES.length.toLocaleString()}</strong><span>County and equivalent selectors</span></div>
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
        <p className="scale-warning">For county and state estimates. Not a parcel-level or stand-level carbon calculator.</p>
      </div>

      <div className="home-dashboard" aria-label="FCO data integrity commitments">
        <div className="dashboard-context"><strong>What every result includes</strong><span>Official data only</span></div>
        <div className="integrity-list">
          {resultContents.map(([title, body]) => (
            <div key={title}><BadgeCheck size={21} /><span><strong>{title}</strong><small>{body}</small></span></div>
          ))}
        </div>
        <div className="home-support">
          <a href="https://venmo.com/u/Steven-Bick-1" target="_blank" rel="noreferrer" onClick={() => trackUsage("support_opened", { page: "home" })}>
            <Coffee size={15} aria-hidden="true" /> Enjoying FCO? Buy me a coffee <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
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
