import type { EstimateResponse } from "../types";

const LAST_RESULT_KEY = "fco:last-result";

export function saveLastResult(result: EstimateResponse) {
  localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
}

export function loadLastResult(): EstimateResponse | null {
  try {
    const value = localStorage.getItem(LAST_RESULT_KEY);
    if (!value) return null;
    const result = JSON.parse(value) as EstimateResponse;
    return result.source_mode === "live" ? result : null;
  } catch {
    return null;
  }
}
