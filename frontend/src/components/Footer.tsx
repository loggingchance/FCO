import { Coffee, ExternalLink } from "lucide-react";
import { NON_AFFILIATION } from "../data/content";

export function Footer() {
  return (
    <footer className="footer">
      <p>{NON_AFFILIATION}</p>
      <a className="footer-support" href="https://venmo.com/u/Steven-Bick-1" target="_blank" rel="noreferrer">
        <Coffee size={16} aria-hidden="true" /> Enjoying FCO? Buy me a coffee <ExternalLink size={13} aria-hidden="true" />
      </a>
    </footer>
  );
}
