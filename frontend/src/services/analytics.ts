export type UsageEvent =
  | "page_view"
  | "estimate_generated"
  | "estimate_failed"
  | "comparison_generated"
  | "comparison_failed"
  | "export_created"
  | "feedback_opened"
  | "support_opened";

export function trackUsage(event: UsageEvent, dimensions: Record<string, string | number | undefined> = {}) {
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, dimensions }),
    keepalive: true,
  }).catch(() => {
    // Anonymous usage reporting must never interrupt the application.
  });
}
