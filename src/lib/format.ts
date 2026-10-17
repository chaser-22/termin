import type { Dict } from "@/i18n/dict";
import { isoWeekday, parseDateKey, type DateKey } from "./time";

export function formatPrice(cents: number | null, onRequest: string): string {
  if (cents === null) return onRequest;
  const euros = cents / 100;
  return `${Number.isInteger(euros) ? euros : euros.toFixed(2).replace(".", ",")} €`;
}

export function formatDuration(minutes: number, unit: string): string {
  if (minutes < 60) return `${minutes} ${unit}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} ${unit}` : `${h} h`;
}

/** "Četvrtak, 22. okt" / "Thursday, 22 Oct" */
export function formatDateLong(key: DateKey, t: Pick<Dict, "weekdays" | "months">, locale: string): string {
  const { m, d } = parseDateKey(key);
  const weekday = t.weekdays[isoWeekday(key) - 1];
  return locale === "me" ? `${weekday}, ${d}. ${t.months[m - 1]}` : `${weekday}, ${d} ${t.months[m - 1]}`;
}
