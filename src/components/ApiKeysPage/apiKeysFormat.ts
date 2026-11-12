/** Formatting for the API Keys page. A missing value is "unknown", never a fabricated 0. */
import { formatClock, isHour12 } from "../../shared/timeFormat";
export const UNKNOWN = "unknown";
export interface ApiKeysFormatLabels {
  unknown?: string;
  unlimited?: string;
}

export function fmtUsd(v: number | null | undefined, labels: ApiKeysFormatLabels = {}): string {
  if (v == null || !Number.isFinite(v)) return labels.unknown ?? UNKNOWN;
  return `$${v < 1 ? v.toFixed(4) : v.toFixed(2)}`;
}

export function fmtBudget(max: number | null, duration: string | null, labels: ApiKeysFormatLabels = {}): string {
  if (max == null) return labels.unlimited ?? "no limit";
  return duration ? `${fmtUsd(max, labels)} / ${duration}` : fmtUsd(max, labels);
}

export function fmtLimit(v: number | null): string {
  return v == null ? "—" : String(v);
}

export function fmtDate(v: string | null, labels: ApiKeysFormatLabels = {}): string {
  if (!v) return "—";
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return labels.unknown ?? UNKNOWN;
  const iso = new Date(t).toISOString();
  if (!isHour12()) return iso.slice(0, 16).replace("T", " ");
  return `${iso.slice(0, 10)} ${formatClock(t, { timeZone: "UTC" })}`;
}

/** Short, non-secret handle for a hashed key id. */
export function shortId(id: string): string {
  return `${id.slice(0, 8)}…`;
}
