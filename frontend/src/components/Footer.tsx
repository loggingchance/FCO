import { Coffee, ExternalLink, MessageSquareText } from "lucide-react";
import { NON_AFFILIATION } from "../data/content";
import { trackUsage } from "../services/analytics";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div><strong>FCO Public Explorer</strong><span>Independent COLE-inspired beta</span></div>
        <div><strong>Data foundation</strong><a href="https://research.fs.usda.gov/programs/fia" target="_blank" rel="noreferrer">USDA Forest Service FIA <ExternalLink size={13} /></a></div>
        <div className="footer-actions">
          <a className="footer-feedback" href="mailto:steve@northeastforests.com?subject=FCO%20feedback%20or%20suggestion&body=Please%20describe%20your%20feedback%20or%20suggestion%20and%20what%20you%20were%20doing%20in%20FCO%3A" onClick={() => trackUsage("feedback_opened")}>
            <MessageSquareText size={16} aria-hidden="true" /> Feedback &amp; suggestions
          </a>
          <a className="footer-support" href="https://venmo.com/u/Steven-Bick-1" target="_blank" rel="noreferrer">
            <Coffee size={16} aria-hidden="true" /> Buy me a beer <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
      <p>{NON_AFFILIATION}</p>
    </footer>
  );
}
