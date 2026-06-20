export const METRIC_TONNES_TO_SHORT_TONS = 1.10231131;

export function isMetricCarbon(unit: string) {
  return unit.toLowerCase().includes("metric tonnes carbon");
}

export function isShortTonCarbon(unit: string) {
  return unit.toLowerCase().includes("short tons carbon");
}

export function isCarbonUnit(unit: string) {
  return isMetricCarbon(unit) || isShortTonCarbon(unit);
}

export function toShortTons(metricTonnes: number) {
  return metricTonnes * METRIC_TONNES_TO_SHORT_TONS;
}

export function toMetricTonnes(shortTons: number) {
  return shortTons / METRIC_TONNES_TO_SHORT_TONS;
}

export function alternateCarbon(value: number, unit: string) {
  const perAcre = unit.toLowerCase().includes("/acre") ? "/acre" : "";
  if (isMetricCarbon(unit)) return { value: toShortTons(value), unit: `short tons carbon${perAcre}` };
  if (isShortTonCarbon(unit)) return { value: toMetricTonnes(value), unit: `metric tonnes carbon${perAcre}` };
  return null;
}

export function formatEstimate(value: number, maximumFractionDigits = 2) {
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

export function formatTotalEstimate(value: number, unit: string) {
  return formatEstimate(roundTotalEstimate(value, unit), isCarbonUnit(unit) ? 0 : 2);
}

export function formatPerAcreEstimate(value: number, unit: string) {
  return formatEstimate(roundPerAcreEstimate(value, unit), isCarbonUnit(unit) ? 1 : 4);
}

export function roundTotalEstimate(value: number, unit: string) {
  return isCarbonUnit(unit) ? Math.round(value) : value;
}

export function roundPerAcreEstimate(value: number, unit: string) {
  return isCarbonUnit(unit) ? Math.round(value * 10) / 10 : value;
}

export function formatPercent(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}
