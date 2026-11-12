import { afterEach, describe, expect, it } from "vitest";
import { formatClock, formatDateTime, formatHourMinute, formatStamp, isHour12, publishHour12, setHour12 } from "./timeFormat";

const NINE_PM = Date.UTC(2026, 0, 1, 21, 4, 9);

afterEach(() => setHour12(false));

describe("time format", () => {
  it("stays on the 24-hour clock until the setting is on", () => {
    expect(isHour12()).toBe(false);
    expect(formatClock(NINE_PM, { timeZone: "UTC" })).toBe("21:04");
    expect(formatClock(Date.UTC(2026, 9, 7, 4, 5), { timeZone: "America/New_York" })).toBe("00:05");
    expect(formatStamp(NINE_PM, { timeZone: "UTC" })).toBe("2026-01-01 21:04:09");
    expect(formatHourMinute(14, 0)).toBe("14:00");
    expect(formatHourMinute(0, 5)).toBe("00:05");
  });

  it("shows 9:04 PM when 12-hour time is on", () => {
    setHour12(true);
    expect(formatClock(NINE_PM, { timeZone: "UTC" })).toBe("9:04 PM");
    expect(formatClock(Date.UTC(2026, 9, 7, 4, 5), { timeZone: "America/New_York" })).toBe("12:05 AM");
    expect(formatStamp(NINE_PM, { timeZone: "UTC" })).toBe("2026-01-01 9:04:09 PM");
    expect(formatHourMinute(14, 30)).toBe("2:30 PM");
    expect(formatHourMinute(0, 0)).toBe("12:00 AM");
  });

  it("treats only a real true as on", () => {
    setHour12(null);
    expect(isHour12()).toBe(false);
    publishHour12(false);
    expect(isHour12()).toBe(false);
    publishHour12(true);
    expect(isHour12()).toBe(true);
    publishHour12(true);
    expect(isHour12()).toBe(true);
  });

  it("matches toLocaleString until 12-hour time is on, then forces a 12-hour clock", () => {
    const date = new Date(NINE_PM);
    const opts = { timeZone: "UTC" } as const;
    expect(formatDateTime(date, { locale: "en-GB", ...opts })).toBe(date.toLocaleString("en-GB", opts));
    expect(formatDateTime(date, { locale: "en-GB", hour: "2-digit", minute: "2-digit", ...opts })).toBe(
      date.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", ...opts }),
    );
    setHour12(true);
    expect(formatDateTime(date, { locale: "en-GB", ...opts })).toBe("01/01/2026, 9:04:09 pm");
    expect(formatDateTime(date, { locale: "en-US", hour: "2-digit", minute: "2-digit", ...opts })).toBe("9:04 PM");
  });
});
