import { useRef } from "react";
import { BarChart3, BookOpen, ChevronDown, Database, FileText, GitCompare, Home, Info, Map, ShieldAlert } from "lucide-react";
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

const primaryIds = new Set<Page>(["home", "explore", "compare", "reports"]);
const primaryItems = navItems.filter(([id]) => primaryIds.has(id));
const secondaryItems = navItems.filter(([id]) => !primaryIds.has(id));

export function Navigation({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const secondaryActive = secondaryItems.some(([id]) => id === page);

  function choose(nextPage: Page) {
    setPage(nextPage);
    if (menu.current) menu.current.open = false;
  }

  return (
    <header className="site-header">
      <button className="brand-banner" onClick={() => choose("home")} aria-label="FCO home">
        <img src="/assets/fco-header.png" alt="FCO Forest Carbon Online - The COLE Tribute App" />
      </button>
      <div className="topbar">
        <button className="brand" onClick={() => choose("home")} aria-label="FCO home" title="FCO home">
          <span className="brand-mark">FCO</span>
          <span className="brand-name">Forest Carbon</span>
        </button>
        <nav className="nav" aria-label="Main navigation">
          {primaryItems.map(([id, label]) => {
            const Icon = icons[id];
            return (
              <button key={id} className={page === id ? "active" : ""} onClick={() => choose(id)} title={label} aria-current={page === id ? "page" : undefined}>
                <Icon size={17} />
                <span>{label}</span>
              </button>
            );
          })}
          <details className="more-menu" ref={menu}>
            <summary className={secondaryActive ? "active" : ""} title="Learn and more">
              <BookOpen size={17} /><span>Learn / More</span><ChevronDown size={16} />
            </summary>
            <div className="more-menu-panel">
              {secondaryItems.map(([id, label]) => {
                const Icon = icons[id];
                return (
                  <button key={id} className={page === id ? "active" : ""} onClick={() => choose(id)} aria-current={page === id ? "page" : undefined}>
                    <Icon size={17} /><span>{label}</span>
                  </button>
                );
              })}
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
