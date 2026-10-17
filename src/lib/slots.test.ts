import { describe, expect, it } from "vitest";
import { availableStarts, mergeStaffSlots } from "./slots";
import { addDays, formatTime, isoWeekday, isDateKey, localToInstant, parseTime } from "./time";

const TZ = "Europe/Podgorica";
const times = (dates: Date[]) => dates.map((d) => formatTime(d, TZ));

describe("time helpers", () => {
  it("computes ISO weekdays", () => {
    expect(isoWeekday("2026-10-19")).toBe(1); // Monday
    expect(isoWeekday("2026-10-25")).toBe(7); // Sunday
  });

  it("converts local time to the right instant across DST", () => {
    // Summer time (UTC+2) and winter time (UTC+1)
    expect(localToInstant("2026-07-01", 9 * 60, TZ).toISOString()).toBe("2026-07-01T07:00:00.000Z");
    expect(localToInstant("2026-12-01", 9 * 60, TZ).toISOString()).toBe("2026-12-01T08:00:00.000Z");
  });

  it("validates dates and times", () => {
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(parseTime("9:30")).toBe(570);
    expect(parseTime("25:00")).toBeNull();
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("availableStarts", () => {
  const monday = "2026-10-19";
  const base = {
    date: monday,
    timeZone: TZ,
    hours: [{ weekday: 1, startMinute: 9 * 60, endMinute: 11 * 60 }],
    busy: [],
    durationMinutes: 30,
    stepMinutes: 30,
    now: new Date("2026-10-01T00:00:00Z"),
    minNoticeMinutes: 60,
  };

  it("lists starts that fit inside working hours", () => {
    expect(times(availableStarts(base))).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("returns nothing on a day off", () => {
    expect(availableStarts({ ...base, date: "2026-10-20" })).toEqual([]);
  });

  it("skips times that overlap an existing booking", () => {
    const busy = [{ startsAt: localToInstant(monday, 9 * 60 + 45, TZ), endsAt: localToInstant(monday, 10 * 60 + 15, TZ) }];
    expect(times(availableStarts({ ...base, busy }))).toEqual(["09:00", "10:30"]);
  });

  it("allows a booking that starts exactly when another ends", () => {
    const busy = [{ startsAt: localToInstant(monday, 9 * 60, TZ), endsAt: localToInstant(monday, 9 * 60 + 30, TZ) }];
    expect(times(availableStarts({ ...base, busy }))).toEqual(["09:30", "10:00", "10:30"]);
  });

  it("respects minimum notice", () => {
    const now = localToInstant(monday, 8 * 60 + 45, TZ);
    expect(times(availableStarts({ ...base, now }))).toEqual(["10:00", "10:30"]);
  });

  it("handles breaks as separate ranges", () => {
    const hours = [
      { weekday: 1, startMinute: 9 * 60, endMinute: 10 * 60 },
      { weekday: 1, startMinute: 11 * 60, endMinute: 12 * 60 },
    ];
    expect(times(availableStarts({ ...base, hours, durationMinutes: 60 }))).toEqual(["09:00", "11:00"]);
  });
});

describe("mergeStaffSlots", () => {
  it("unions times and keeps who is free", () => {
    const a = new Date("2026-10-19T08:00:00Z");
    const b = new Date("2026-10-19T08:30:00Z");
    const merged = mergeStaffSlots([
      { staffId: "s1", starts: [b] },
      { staffId: "s2", starts: [a, b] },
    ]);
    expect(merged).toEqual([
      { start: a, staffIds: ["s2"] },
      { start: b, staffIds: ["s1", "s2"] },
    ]);
  });
});
