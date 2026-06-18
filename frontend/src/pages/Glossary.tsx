import { glossary } from "../data/content";

export function Glossary() {
  return (
    <section className="document-page">
      <h1>Glossary</h1>
      <dl>{glossary.map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
    </section>
  );
}

