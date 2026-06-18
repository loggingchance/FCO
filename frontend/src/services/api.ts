import type { CountyOption, EstimateRequest, EstimateResponse, StateOption } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const api = {
  states: () => getJson<StateOption[]>("/api/geographies/states"),
  counties: (state: string) => getJson<CountyOption[]>(`/api/geographies/counties?state=${encodeURIComponent(state)}`),
  estimateTypes: () => getJson<{ id: string; label: string; unit: string }[]>("/api/options/estimate-types"),
  estimate: (payload: EstimateRequest) => postJson<EstimateResponse>("/api/estimate", payload),
  reportUrl: (format: "html" | "pdf") => `${API_BASE}/api/report?format=${format}`,
};
