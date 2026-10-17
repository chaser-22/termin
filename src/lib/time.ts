import { TZDate } from "@date-fns/tz";

// Dates without a time are handled as "YYYY-MM-DD" strings in the business's
// own calendar; instants are plain Date objects (UTC under the hood).

export type DateKey = string;

export function parseDateKey(key: DateKey): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error(`Invalid date: ${key}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { y, m, d } = parseDateKey(value);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** ISO weekday of a calendar date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(key: DateKey): number {
  const { y, m, d } = parseDateKey(key);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDays(key: DateKey, days: number): DateKey {
  const { y, m, d } = parseDateKey(key);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** The instant at `minutes` after local midnight of `key` in `timeZone`. */
export function localToInstant(key: DateKey, minutes: number, timeZone: string): Date {
  const { y, m, d } = parseDateKey(key);
  const tz = new TZDate(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, timeZone);
  return new Date(tz.getTime());
}

/** Today's calendar date in `timeZone`. */
export function todayKey(timeZone: string, now: Date = new Date()): DateKey {
  return dateKeyOf(now, timeZone);
}

export function dateKeyOf(instant: Date, timeZone: string): DateKey {
  const tz = new TZDate(instant.getTime(), timeZone);
  const y = tz.getFullYear();
  const m = String(tz.getMonth() + 1).padStart(2, "0");
  const d = String(tz.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Minutes after local midnight for an instant in `timeZone`. */
export function minutesOfDay(instant: Date, timeZone: string): number {
  const tz = new TZDate(instant.getTime(), timeZone);
  return tz.getHours() * 60 + tz.getMinutes();
}

/** True when the instant has already happened. */
export function isPast(instant: Date): boolean {
  return instant.getTime() < Date.now();
}

export function formatMinutes(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** "09:30" → 570. Returns null for invalid input. */
export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return h * 60 + m;
}

export function formatTime(instant: Date, timeZone: string): string {
  return formatMinutes(minutesOfDay(instant, timeZone));
}
