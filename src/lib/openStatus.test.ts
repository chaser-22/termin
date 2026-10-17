import { describe, expect, it } from "vitest";
import { openStatus } from "./openStatus";
import { localToInstant } from "./time";

const TZ = "Europe/Podgorica";
const mon = "2026-10-19";
const hours = [
  { weekday: 1, startMinute: 540, endMinute: 780 }, // Mon 09–13
  { weekday: 1, startMinute: 780, endMinute: 1200 }, // Mon 13–20 (another staff member)
  { weekday: 3, startMinute: 600, endMinute: 900 }, // Wed 10–15
];

describe("openStatus", () => {
  it("is open until the end of touching ranges", () => {
    expect(openStatus(hours, TZ, localToInstant(mon, 600, TZ))).toEqual({ open: true, until: 1200 });
  });

  it("opens later today", () => {
    expect(openStatus(hours, TZ, localToInstant(mon, 480, TZ))).toEqual({ open: false, opensDate: mon, opensAt: 540, inDays: 0 });
  });

  it("opens on a later day after closing", () => {
    expect(openStatus(hours, TZ, localToInstant(mon, 1230, TZ))).toEqual({ open: false, opensDate: "2026-10-21", opensAt: 600, inDays: 2 });
  });

  it("handles no hours at all", () => {
    expect(openStatus([], TZ, localToInstant(mon, 600, TZ))).toEqual({ open: false, opensDate: null });
  });
});
