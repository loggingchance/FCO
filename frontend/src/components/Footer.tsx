import { Coffee, ExternalLink } from "lucide-react";
import { NON_AFFILIATION } from "../data/content";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div><strong>FCO Public Explorer</strong><span>Independent COLE-inspired beta</span></div>
        <div><strong>Data foundation</strong><a href="https://research.fs.usda.gov/programs/fia" target="_blank" rel="noreferrer">USDA Forest Service FIA <ExternalLink size={13} /></a></div>
        <a className="footer-support" href="https://venmo.com/u/Steven-Bick-1" target="_blank" rel="noreferrer">
          <Coffee size={16} aria-hidden="true" /> Buy me a coffee <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
      <p>{NON_AFFILIATION}</p>
    </footer>
  );
}
