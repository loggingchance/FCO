import { BarChart3, BookOpen, Database, FileText, GitCompare, Home, Info, Map, ShieldAlert, Wrench } from "lucide-react";
import type { Page } from "../types";
import { navItems } from "../data/content";

const icons: Record<string, React.ComponentType<{ size?: number }>> = {
  home: Home,
  explore: Map,
  compare: GitCompare,
  reports: FileText,
  methodology: BarChart3,
  history: BookOpen,
  about: Info,
  limitations: ShieldAlert,
  data: Database,
  glossary: BookOpen,
};

export function Navigation({
  page,
  setPage,
  enableWorkbench,
}: {
  page: Page;
  setPage: (page: Page) => void;
  enableWorkbench: boolean;
}) {
  return (
    <header className="site-header">
      <button className="brand-banner" onClick={() => setPage("home")} aria-label="FCO home">
        <img src="/assets/fco-header.png" alt="FCO Forest Carbon Online - The COLE Tribute App" />
      </button>
      <div className="topbar">
        <button className="brand" onClick={() => setPage("home")} aria-label="FCO home">
          <span className="brand-mark">FCO</span>
          <span>
            <strong>Forest Carbon Online</strong>
            <em>The COLE Tribute App</em>
          </span>
        </button>
        <nav className="nav">
          {navItems.map(([id, label]) => {
            const Icon = icons[id];
            return (
              <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id as Page)} title={label}>
                <Icon size={17} />
                <span>{label}</span>
              </button>
            );
          })}
          {enableWorkbench && (
            <button className={page === "workbench" ? "active" : ""} onClick={() => setPage("workbench")} title="Impact Workbench">
              <Wrench size={17} />
              <span>Workbench</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
