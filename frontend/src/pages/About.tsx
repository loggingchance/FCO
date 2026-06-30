import { Coffee, ExternalLink } from "lucide-react";
import { NON_AFFILIATION } from "../data/content";

function ExternalTextLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children} <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}

export function About() {
  return (
    <section className="document-page about-page">
      <p className="eyebrow">About</p>
      <h1>About FCO</h1>

      <div className="about-copy">
        <p>
          FCO was created by Dr. Steven Bick of{" "}
          <ExternalTextLink href="https://www.northeastforests.com">Northeast Forests, LLC</ExternalTextLink>{" "}
          and{" "}
          <ExternalTextLink href="https://www.forestenterprise.org">The Forest Business School</ExternalTextLink>.
        </p>

        <p>
          Much of Dr. Bick's work focuses on making complicated tools, systems, and ideas easier to use in real business and forest management settings. The goal is to retain the abilities of a good technical tool while removing barriers to using it. Simplifying access to complex calculations makes things better for the user and, in the end, better for forests and other natural resources.
        </p>

        <p>
          FCO follows that same idea. It is designed as an approachable way to explore broad-area forest carbon estimates from Forest Inventory and Analysis data. The goal is to help foresters, landowners, agencies, educators, forest-based businesses, and interested members of the public understand forest carbon information without first having to master FIA database structure or EVALIDator workflows.
        </p>

        <h2>The COLE connection</h2>
        <p>
          COLE, the Carbon OnLine Estimator, showed how a web-based tool could make FIA forest carbon estimates easier to reach and understand. FCO honors that practical idea. The name Forest Carbon Online and the subtitle The COLE Tribute App recognize the value of making technically complex public forest information more accessible.
        </p>

        <p>
          FCO is an independent tribute, not an official successor to COLE. It does not reproduce or claim ownership of the original COLE application, and it does not represent the organizations or individuals involved in COLE's development. FCO is separately designed and maintained using public data and public documentation.
        </p>

        <aside className="non-affiliation" aria-label="Non-affiliation notice">
          <strong>Independent and unofficial</strong>
          <p>{NON_AFFILIATION}</p>
        </aside>

        <p>
          More of Dr. Bick's work, writing, and tools can be found at{" "}
          <ExternalTextLink href="https://www.northeastforests.com">Northeast Forests</ExternalTextLink>,{" "}
          <ExternalTextLink href="https://www.forestenterprise.org">The Forest Business School</ExternalTextLink>, and the{" "}
          <ExternalTextLink href="https://www.loggingchance.com">Logging Chance website</ExternalTextLink>.
        </p>

        <p>
          Contact: <a href="mailto:steve@northeastforests.com">steve@northeastforests.com</a>
        </p>

        <h2>Privacy and usage reporting</h2>
        <p>
          FCO records anonymous, aggregate product events to understand which pages, geographies, estimates, groupings, and exports are being used and where requests fail. It does not place analytics cookies or store names, email addresses, IP addresses, or other user identifiers in its usage reports.
        </p>

        <aside className="support-note" aria-label="Support FCO">
          <Coffee size={24} aria-hidden="true" />
          <div>
            <strong>Enjoying FCO?</strong>
            <p>If this app has been useful, consider buying me a beer through Venmo.</p>
          </div>
          <a className="support-link" href="https://venmo.com/u/Steven-Bick-1" target="_blank" rel="noreferrer">
            Buy me a beer <ExternalLink size={14} aria-hidden="true" />
          </a>
        </aside>
      </div>
    </section>
  );
}
