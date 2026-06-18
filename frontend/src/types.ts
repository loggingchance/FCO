export type Page =
  | "home"
  | "explore"
  | "compare"
  | "reports"
  | "methodology"
  | "history"
  | "about"
  | "limitations"
  | "data"
  | "glossary"
  | "workbench";

export interface StateOption {
  code: string;
  name: string;
}

export interface CountyOption {
  state: string;
  name: string;
  fips: string;
}

export interface EstimateRequest {
  geography: {
    type: "state" | "county" | "multi_county" | "multi_state";
    states: string[];
    counties: string[];
  };
  estimate_type: string;
  filters: Record<string, string>;
  grouping?: string;
  evaluation_year?: number;
  live_data?: boolean;
}

export interface EstimateRow {
  label: string;
  total: number;
  per_acre: number;
  area_acres: number;
  sampling_error_percent: number | null;
  plot_count?: number | null;
  unit: string;
}

export interface EstimateResponse {
  request: EstimateRequest;
  headline: {
    label: string;
    value: number;
    unit: string;
    per_acre: number;
  };
  rows: EstimateRow[];
  warnings: string[];
  method_note: string;
  data_source: string;
  source_mode: "live" | "mock" | "mock_fallback";
  evaluation_year?: number | null;
  generated_at: string;
}

export interface WizardAnswers {
  geography: string;
  question: string;
  timeframe: string;
  data: string;
  precision: string;
}

export interface WizardRoute {
  module: string;
  warning: string;
  next_step: string;
}
