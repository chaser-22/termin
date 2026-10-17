import { isoWeekday, localToInstant, type DateKey } from "./time";

export type HoursRange = { weekday: number; startMinute: number; endMinute: number };
export type BusyRange = { startsAt: Date; endsAt: Date };

export type SlotInput = {
  date: DateKey;
  timeZone: string;
  hours: HoursRange[];
  busy: BusyRange[];
  durationMinutes: number;
  stepMinutes: number;
  now: Date;
  minNoticeMinutes: number;
};

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Start times one staff member can take on `date`: inside working hours,
 * not overlapping a busy range, and at least `minNoticeMinutes` from now.
 * Starts are aligned to `stepMinutes` from the start of each hours range.
 */
export function availableStarts(input: SlotInput): Date[] {
  const weekday = isoWeekday(input.date);
  const earliest = new Date(input.now.getTime() + input.minNoticeMinutes * 60_000);
  const step = Math.max(5, input.stepMinutes);
  const result: Date[] = [];

  const ranges = input.hours
    .filter((h) => h.weekday === weekday && h.endMinute > h.startMinute)
    .sort((a, b) => a.startMinute - b.startMinute);

  for (const range of ranges) {
    for (let t = range.startMinute; t + input.durationMinutes <= range.endMinute; t += step) {
      const start = localToInstant(input.date, t, input.timeZone);
      const end = new Date(start.getTime() + input.durationMinutes * 60_000);
      if (start < earliest) continue;
      if (input.busy.some((b) => overlaps(start, end, b.startsAt, b.endsAt))) continue;
      result.push(start);
    }
  }
  return result;
}

export type StaffSlots = { staffId: string; starts: Date[] };

/** Merge per-staff starts into one list; each time keeps the staff who can take it, in the order given. */
export function mergeStaffSlots(perStaff: StaffSlots[]): { start: Date; staffIds: string[] }[] {
  const map = new Map<number, string[]>();
  for (const { staffId, starts } of perStaff) {
    for (const start of starts) {
      const key = start.getTime();
      const list = map.get(key);
      if (list) list.push(staffId);
      else map.set(key, [staffId]);
    }
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, staffIds]) => ({ start: new Date(time), staffIds }));
}
