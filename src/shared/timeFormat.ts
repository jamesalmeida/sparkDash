/**
 * Clock format for every rendered time. Off (the default) leaves each existing
 * formatter alone, which is the 24-hour clock the activity log and the chart
 * axes already use. On shows 12-hour times ("9:04 PM"). A module-level value
 * because the chart helpers are plain functions; App re-keys the page when it
 * changes, the same way as the time zone, and useHour12 re-renders a subscriber.
 */
import { useSyncExternalStore } from "react";

let hour12 = false;
const listeners = new Set<() => void>();

export function isHour12(): boolean {
  return hour12;
}

/**
 * Remember the Settings value. Does not notify subscribers, so it is safe to
 * call while rendering (App sets it the same way as the time zone).
 */
export function setHour12(value: boolean | null | undefined): void {
  hour12 = value === true;
}

/** Remember the Settings value and re-render subscribers. Call from effects and event handlers. */
export function publishHour12(value: boolean | null | undefined): void {
  const next = value === true;
  if (next === hour12) return;
  hour12 = next;
  for (const listener of listeners) listener();
}

/** The current 12-hour setting. Subscribers re-render when publishHour12 changes it. */
export function useHour12(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    isHour12,
    () => false,
  );
}

export interface ClockOptions {
  timeZone?: string;
  /** Defaults to en-US so "9:04 PM" and "21:04" do not follow the test runner's locale. */
  locale?: string;
  seconds?: boolean;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function cached(locale: string | undefined, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale ?? ""}\0${JSON.stringify(opts)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, opts);
    formatters.set(key, formatter);
  }
  return formatter;
}

function toDate(value: number | Date): Date {
  return typeof value === "number" ? new Date(value) : value;
}

/** "21:04" or, when 12-hour time is on, "9:04 PM". */
export function formatClock(value: number | Date, options: ClockOptions = {}): string {
  const on = isHour12();
  const opts: Intl.DateTimeFormatOptions = {
    hour: on ? "numeric" : "2-digit",
    minute: "2-digit",
    hourCycle: on ? "h12" : "h23",
  };
  if (options.seconds) opts.second = "2-digit";
  if (options.timeZone) opts.timeZone = options.timeZone;
  return cached(options.locale ?? "en-US", opts).format(toDate(value));
}

/** "2026-10-07 14:05:09", or "2026-10-07 2:05:09 PM" when 12-hour time is on. */
export function formatStamp(value: number | Date, options: ClockOptions = {}): string {
  const date = toDate(value);
  const locale = options.locale ?? "en-US";
  const partOpts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  };
  if (options.timeZone) partOpts.timeZone = options.timeZone;
  const parts = cached(locale, partOpts).formatToParts(date);
  const g = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")} ${formatClock(date, { ...options, locale, seconds: true })}`;
}

/**
 * Hour and minute already shifted onto a wall clock (UTC fields of that shift).
 * "14:00", or "2:00 PM" when 12-hour time is on.
 */
export function formatHourMinute(hours: number, minutes: number, locale?: string): string {
  if (!isHour12()) return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return formatClock(new Date(Date.UTC(2020, 0, 1, hours, minutes, 0)), {
    timeZone: "UTC",
    locale: locale ?? "en-US",
  });
}

export interface DateTimeOptions extends Intl.DateTimeFormatOptions {
  locale?: string;
}

/**
 * A date and time, matching Date#toLocaleString when 12-hour time is off.
 * On, the same fields are shown with a 12-hour clock (hour "numeric", so 9:04 PM).
 */
export function formatDateTime(value: number | Date, options: DateTimeOptions = {}): string {
  const { locale, ...rest } = options;
  const opts: Intl.DateTimeFormatOptions = { ...rest };
  if (isHour12()) {
    opts.hourCycle = "h12";
    if (opts.hour != null && opts.timeStyle == null) opts.hour = "numeric";
  }
  const date = toDate(value);
  return Object.keys(opts).length > 0 ? date.toLocaleString(locale, opts) : date.toLocaleString(locale);
}
