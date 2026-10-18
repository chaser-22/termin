import { isoWeekday, localToInstant, type DateKey } from "./time";

export type HoursRange = { weekday: number; startMinute: number; endMinute: number };
/** An existing booking that occupies time. `serviceId` lets classes share a start. */
export type BusyRange = { startsAt: Date; endsAt: Date; serviceId?: string };
export type ClassTime = { weekday: number; startMinute: number };

export type SlotInput = {
  date: DateKey;
  timeZone: string;
  hours: HoursRange[];
  busy: BusyRange[];
  durationMinutes: number;
  stepMinutes: number;
  now: Date;
  minNoticeMinutes: number;
  /** Places per start. Above 1, bookings of the same service at the same start share it. */
  capacity?: number;
  serviceId?: string;
  /** For classes: the only starts offered, instead of a grid over working hours. */
  classTimes?: ClassTime[];
};

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** How many bookings of this service already sit at exactly this start. */
export function placesTaken(start: Date, busy: BusyRange[], serviceId: string | undefined): number {
  return busy.filter((b) => b.serviceId === serviceId && b.startsAt.getTime() === start.getTime()).length;
}

/**
 * Whether [start, end) can be booked against existing bookings. With capacity
 * above 1, the only overlaps allowed are bookings of the same service at the
 * same start, and only while places are left.
 */
export function fits(start: Date, end: Date, busy: BusyRange[], capacity = 1, serviceId?: string): boolean {
  const clashing = busy.filter((b) => overlaps(start, end, b.startsAt, b.endsAt));
  if (clashing.length === 0) return true;
  if (capacity <= 1) return false;
  const sameClass = clashing.every((b) => b.serviceId === serviceId && b.startsAt.getTime() === start.getTime());
  return sameClass && clashing.length < capacity;
}

/**
 * Start times one staff member can take on `date`, at least `minNoticeMinutes`
 * from now. Normally starts are aligned to `stepMinutes` inside working hours;
 * a class offers only its scheduled class times.
 */
export function availableStarts(input: SlotInput): Date[] {
  const weekday = isoWeekday(input.date);
  const earliest = new Date(input.now.getTime() + input.minNoticeMinutes * 60_000);
  const capacity = input.capacity ?? 1;
  const candidates: number[] = [];

  if (input.classTimes) {
    for (const c of input.classTimes) if (c.weekday === weekday) candidates.push(c.startMinute);
    candidates.sort((a, b) => a - b);
  } else {
    const step = Math.max(5, input.stepMinutes);
    const ranges = input.hours
      .filter((h) => h.weekday === weekday && h.endMinute > h.startMinute)
      .sort((a, b) => a.startMinute - b.startMinute);
    for (const range of ranges) {
      for (let t = range.startMinute; t + input.durationMinutes <= range.endMinute; t += step) candidates.push(t);
    }
  }

  const result: Date[] = [];
  for (const t of candidates) {
    const start = localToInstant(input.date, t, input.timeZone);
    const end = new Date(start.getTime() + input.durationMinutes * 60_000);
    if (start < earliest) continue;
    if (!fits(start, end, input.busy, capacity, input.serviceId)) continue;
    result.push(start);
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
