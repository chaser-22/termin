import { addDays, isoWeekday, minutesOfDay, todayKey, type DateKey } from "./time";

type Range = { weekday: number; startMinute: number; endMinute: number };

export type OpenStatus =
  | { open: true; until: number }
  | { open: false; opensDate: DateKey; opensAt: number; inDays: number }
  | { open: false; opensDate: null };

/** Whether the business (any staff member) is working now, and until when / when it opens next. */
export function openStatus(hours: Range[], timeZone: string, now: Date = new Date()): OpenStatus {
  const today = todayKey(timeZone, now);
  const nowMin = minutesOfDay(now, timeZone);
  const todays = hours.filter((h) => h.weekday === isoWeekday(today));

  // Open now: extend through ranges that touch, so a staff hand-over doesn't read as closing
  const current = todays.filter((h) => h.startMinute <= nowMin && nowMin < h.endMinute);
  if (current.length) {
    let until = Math.max(...current.map((h) => h.endMinute));
    let grew = true;
    while (grew) {
      grew = false;
      for (const h of todays) {
        if (h.startMinute <= until && h.endMinute > until) {
          until = h.endMinute;
          grew = true;
        }
      }
    }
    return { open: true, until };
  }

  for (let i = 0; i < 8; i++) {
    const date = addDays(today, i);
    const starts = hours
      .filter((h) => h.weekday === isoWeekday(date) && (i > 0 || h.startMinute > nowMin))
      .map((h) => h.startMinute);
    if (starts.length) return { open: false, opensDate: date, opensAt: Math.min(...starts), inDays: i };
  }
  return { open: false, opensDate: null };
}
