import { DecisionWizard } from "../components/DecisionWizard";
import { WORKBENCH_NOTICE } from "../data/content";

const modules = [
  "Project Setup",
  "Study Area and Comparison Framework",
  "Data Intake",
  "Land Base",
  "FIA Baseline",
  "FVS Scenario Lab",
  "Timber Products and Markets",
  "Economic Impact",
  "Fiscal and Tax",
  "Recreation Economy",
  "Environmental Benefits",
  "Public Access",
  "Stakeholder Evidence",
  "Assumptions Registry",
  "QA and Validation",
  "Report Builder",
  "Export Center",
];

export function Workbench() {
  return (
    <div className="page-grid">
      <section className="panel wide">
        <p className="eyebrow">Analyst-only extension</p>
        <h1>FCO Impact Workbench</h1>
        <p className="lede">A project workspace for county forest ownership, economic, fiscal, recreation, environmental, and community impact studies.</p>
        <p className="warning-text">{WORKBENCH_NOTICE}</p>
      </section>
      <DecisionWizard />
      <section className="panel wide module-grid">
        {modules.map((item) => <article key={item}><h2>{item}</h2><p>{item === "Assumptions Registry" ? "Track source, confidence, analyst, date, and notes." : "Beta shell with mocked project data and report-ready placeholders."}</p></article>)}
      </section>
    </div>
  );
}

