import { useState } from "react";
import { Compass } from "lucide-react";
import type { WizardAnswers, WizardRoute } from "../types";
import { api } from "../services/api";

const defaults: WizardAnswers = {
  geography: "County",
  question: "Current carbon stock",
  timeframe: "Current stock only",
  data: "FIA-only",
  precision: "Public education",
};

export function DecisionWizard() {
  const [answers, setAnswers] = useState(defaults);
  const [route, setRoute] = useState<WizardRoute | null>(null);

  const set = (key: keyof WizardAnswers, value: string) => setAnswers((current) => ({ ...current, [key]: value }));

  async function routeQuestion() {
    setRoute(await api.routeWizard(answers));
  }

  return (
    <section className="wizard">
      <div>
        <h2><Compass size={20} /> Right-tool decision wizard</h2>
        <p>Answer a few questions so FCO routes the work to the right model and shows the right limitations.</p>
      </div>
      <div className="wizard-grid">
        <label>
          Geography
          <select value={answers.geography} onChange={(e) => set("geography", e.target.value)}>
            {["State", "County", "Multiple counties", "Multiple states", "County forest system", "Custom polygon", "Individual property", "Stand or treatment unit"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          Question
          <select value={answers.question} onChange={(e) => set("question", e.target.value)}>
            {["Current forest area", "Current carbon stock", "Carbon by pool", "Growing-stock volume", "Management scenario", "Timber revenue", "Regional economic impact", "County fiscal/tax impact", "Recreation spending", "Water, air, climate, habitat, or hazard mitigation benefit", "Stakeholder perceptions"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          Timeframe
          <select value={answers.timeframe} onChange={(e) => set("timeframe", e.target.value)}>
            {["Current stock only", "Trend from inventory data", "Future management scenario", "Economic contribution of existing activity", "Economic impact of a defined change"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          Data
          <select value={answers.data} onChange={(e) => set("data", e.target.value)}>
            {["FIA-only", "County forest boundaries", "Stand inventory", "Timber sale data", "County financial records", "Recreation use data", "Survey/interview data", "GIS layers", "IMPLAN or RIMS II outputs"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          Use
          <select value={answers.precision} onChange={(e) => set("precision", e.target.value)}>
            {["Public education", "Grant appendix", "Technical report", "Policy decision support", "Project-level analysis", "Formal carbon accounting"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
      </div>
      <button className="primary compact" onClick={routeQuestion}>Route this question</button>
      {route && (
        <div className="route-result">
          <strong>{route.module}</strong>
          <p>{route.next_step}</p>
          <p className="warning-text">{route.warning}</p>
        </div>
      )}
    </section>
  );
}

