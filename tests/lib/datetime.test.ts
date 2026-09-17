import { describe, expect, it } from "vitest";
import {
  combineDateTimeToISO,
  splitISOToDateAndTime,
  formatDateTR,
  formatTimeTR,
} from "@/lib/datetime";

describe("combineDateTimeToISO", () => {
  it("converts Europe/Istanbul local time to UTC ISO", () => {
    // 27.08.2026 14:30 Istanbul (+03:00) -> 11:30 UTC
    expect(combineDateTimeToISO("2026-08-27", "14:30")).toBe(
      "2026-08-27T11:30:00.000Z",
    );
  });
});

describe("splitISOToDateAndTime", () => {
  it("round-trips back to the original local date/time", () => {
    const iso = combineDateTimeToISO("2026-01-15", "09:05");
    expect(splitISOToDateAndTime(iso)).toEqual({ date: "2026-01-15", time: "09:05" });
  });

  it("handles a UTC instant that falls on a different Istanbul day", () => {
    // 2026-01-01 23:30 UTC -> 2026-01-02 02:30 Istanbul (+03:00)
    expect(splitISOToDateAndTime("2026-01-01T23:30:00.000Z")).toEqual({
      date: "2026-01-02",
      time: "02:30",
    });
  });
});

describe("formatDateTR / formatTimeTR", () => {
  it("formats as GG.AA.YYYY and HH:mm", () => {
    const iso = combineDateTimeToISO("2026-03-05", "08:00");
    expect(formatDateTR(iso)).toBe("05.03.2026");
    expect(formatTimeTR(iso)).toBe("08:00");
  });
});
