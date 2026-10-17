"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "@/app/actions";
import type { Dict } from "@/i18n/dict";
import { formatDuration, formatPrice } from "@/lib/format";

type ServiceOption = { id: string; name: string; durationMinutes: number; priceCents: number | null };
type StaffOption = { id: string; name: string; weekdays: number[] };
type DayOption = { key: string; weekday: number; day: number; month: number };
type T = Pick<Dict, "book" | "common" | "weekdaysShort" | "months">;

type Props = {
  slug: string;
  timeZone: string;
  services: ServiceOption[];
  staff: StaffOption[];
  days: DayOption[];
  t: T;
};

type Details = { name: string; phone: string; email: string };
const DETAILS_KEY = "termin:details";

function loadDetails(): Details {
  try {
    const raw = localStorage.getItem(DETAILS_KEY);
    if (raw) return { name: "", phone: "", email: "", ...JSON.parse(raw) };
  } catch {}
  return { name: "", phone: "", email: "" };
}

// Stable ref callback: scrolls once when the element mounts, not on every render
function scrollIntoViewOnMount(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveDetails(d: Details) {
  try {
    localStorage.setItem(DETAILS_KEY, JSON.stringify(d));
  } catch {}
}

export function BookingFlow({ slug, timeZone, services, staff, days, t }: Props) {
  const [serviceId, setServiceId] = useState<string | null>(services.length === 1 ? services[0].id : null);
  const [staffId, setStaffId] = useState<string>(staff.length === 1 ? staff[0].id : "any");
  // The day the customer tapped; until then we pick one for them
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  // Free times per service|staff|day, filled by fetches; undefined = not loaded yet
  const [slotCache, setSlotCache] = useState<Record<string, string[]>>({});
  const [selection, setSelection] = useState<{ key: string; slot: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const chosenStaff = staff.find((s) => s.id === staffId) ?? null;
  const keyFor = (date: string) => `${serviceId}|${staffId}|${date}`;

  const openDays = useMemo(() => {
    const open = new Set<number>();
    for (const s of staff) if (staffId === "any" || s.id === staffId) s.weekdays.forEach((w) => open.add(w));
    return days.filter((d) => open.has(d.weekday));
  }, [staff, staffId, days]);

  // Chosen day, or else the first open day not already known to be full
  const date = useMemo(() => {
    if (pickedDate && openDays.some((d) => d.key === pickedDate)) return pickedDate;
    for (const d of openDays) {
      const cached = slotCache[`${serviceId}|${staffId}|${d.key}`];
      if (cached === undefined || cached.length > 0) return d.key;
    }
    return openDays[0]?.key ?? null;
  }, [pickedDate, openDays, slotCache, serviceId, staffId]);

  const key = date ? keyFor(date) : null;
  // No open day at all (no working hours) reads as "no free times", not loading
  const slots = key ? (slotCache[key] ?? null) : [];
  const slot = selection && selection.key === key ? selection.slot : null;
  const selectedDay = days.find((d) => d.key === date) ?? null;

  useEffect(() => {
    if (!service || !date || !key || slotCache[key] !== undefined) return;
    const ctrl = new AbortController();
    fetch(`/api/slots?b=${encodeURIComponent(slug)}&s=${service.id}&st=${staffId}&d=${date}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { slots?: string[] }) => setSlotCache((c) => ({ ...c, [key]: data.slots ?? [] })))
      .catch((e) => {
        if (e.name !== "AbortError") setSlotCache((c) => ({ ...c, [key]: [] }));
      });
    return () => ctrl.abort();
  }, [slug, service, staffId, date, key, slotCache]);

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }),
    [timeZone],
  );

  if (services.length === 0) {
    return <p className="card p-6 text-muted">{t.book.noServices}</p>;
  }

  return (
    <div className={`space-y-4 ${slot ? "pb-32" : ""}`}>
      {/* 1. Service */}
      <section className="card overflow-hidden">
        <StepHeader n={1} title={t.book.chooseService} done={!!service} onChange={services.length > 1 && service ? () => setServiceId(null) : undefined} changeLabel={t.book.change} />
        {service ? (
          <div className="px-5 pb-4 flex items-baseline justify-between gap-4">
            <span className="font-medium">{service.name}</span>
            <span className="text-sm text-muted whitespace-nowrap">
              {formatDuration(service.durationMinutes, t.common.minutes)} · {formatPrice(service.priceCents, t.common.priceOnRequest)}
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <span>
                    <span className="block font-medium">{s.name}</span>
                    <span className="block text-sm text-muted">{formatDuration(s.durationMinutes, t.common.minutes)}</span>
                  </span>
                  <span className="font-medium whitespace-nowrap">{formatPrice(s.priceCents, t.common.priceOnRequest)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. Staff */}
      {service && staff.length > 1 && (
        <section className="card">
          <StepHeader n={2} title={t.book.chooseStaff} done />
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {[{ id: "any", name: t.book.anyStaff }, ...staff].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStaffId(s.id)}
                className={`h-10 px-4 rounded-full border text-sm font-medium transition-colors cursor-pointer ${
                  staffId === s.id ? "bg-ink text-bg border-ink" : "border-line hover:bg-surface-2"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. Date and time */}
      {service && (
        <section className="card">
          <StepHeader n={staff.length > 1 ? 3 : 2} title={t.book.chooseTime} done={!!slot} />
          <div className="flex gap-2 overflow-x-auto px-5 pb-3 snap-x [scrollbar-width:none]">
            {days.map((d) => {
              const open = openDays.includes(d);
              const selected = d.key === date;
              return (
                <button
                  key={d.key}
                  type="button"
                  disabled={!open}
                  onClick={() => setPickedDate(d.key)}
                  className={`snap-start shrink-0 w-14 py-2 rounded-xl border text-center transition-colors cursor-pointer disabled:cursor-default ${
                    selected
                      ? "bg-accent border-accent text-accent-ink"
                      : open
                        ? "border-line hover:bg-surface-2"
                        : "border-transparent text-muted/50"
                  }`}
                >
                  <span className="block text-[11px] uppercase tracking-wide opacity-80">{t.weekdaysShort[d.weekday - 1]}</span>
                  <span className="block text-lg font-semibold leading-tight">{d.day}</span>
                  <span className="block text-[11px] opacity-70">{t.months[d.month - 1]}</span>
                </button>
              );
            })}
          </div>
          <div className="px-5 pb-5 min-h-24">
            {slots === null ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-xl bg-surface-2 animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-muted py-6 text-center">{t.book.noSlots}</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSelection(key ? { key, slot: s } : null);
                    }}
                    className={`h-11 rounded-xl border text-[15px] font-medium tabular-nums transition-colors cursor-pointer ${
                      slot === s ? "bg-accent border-accent text-accent-ink" : "border-line hover:border-accent hover:text-accent"
                    }`}
                  >
                    {timeFmt.format(new Date(s))}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Details + sticky confirm bar */}
      {service && slot && key && (
        <DetailsStep
          n={staff.length > 1 ? 4 : 3}
          slug={slug}
          serviceId={service.id}
          staffId={staffId === "any" ? null : staffId}
          slot={slot}
          summary={{
            title: service.name,
            line: `${selectedDay ? `${t.weekdaysShort[selectedDay.weekday - 1]} ${selectedDay.day}. ` : ""}${timeFmt.format(new Date(slot))}${chosenStaff ? ` · ${chosenStaff.name}` : ""}`,
          }}
          t={t}
          onSlotTaken={() => {
            setError(t.book.slotTaken);
            setSelection(null);
            // Drop the stale times so they load again
            setSlotCache((c) => {
              const next = { ...c };
              delete next[key];
              return next;
            });
          }}
        />
      )}
      {error && !slot && <p className="text-danger text-sm text-center">{error}</p>}
    </div>
  );
}

/** Mounted only after a time is picked, so reading saved details from the browser is safe. */
function DetailsStep({
  n,
  slug,
  serviceId,
  staffId,
  slot,
  summary,
  t,
  onSlotTaken,
}: {
  n: number;
  slug: string;
  serviceId: string;
  staffId: string | null;
  slot: string;
  summary: { title: string; line: string };
  t: T;
  onSlotTaken: () => void;
}) {
  const router = useRouter();
  const [details, setDetails] = useState<Details>(loadDetails);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSubmit(async () => {
      const res = await bookAppointment({ slug, serviceId, staffId, startsAt: slot, ...details, note });
      if (res.ok) {
        saveDetails(details);
        router.push(`/booking/${res.token}`);
      } else if (res.error === "slot_taken") {
        onSlotTaken();
      } else {
        setError(res.error === "phone" ? t.book.invalidPhone : res.error === "name" ? t.book.invalidName : t.common.error);
      }
    });
  }

  return (
    <>
      <section ref={scrollIntoViewOnMount} className="card scroll-mt-4">
        <StepHeader n={n} title={t.book.yourDetails} done={false} />
        <form id="book-form" onSubmit={submit} className="px-5 pb-5 space-y-4">
          <div>
            <label className="label" htmlFor="name">{t.book.name}</label>
            <input id="name" className="input" required minLength={2} autoComplete="name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="phone">{t.book.phone}</label>
            <input id="phone" className="input" required type="tel" inputMode="tel" autoComplete="tel" placeholder="067 123 456" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="email">{t.book.email}</label>
            <input id="email" className="input" type="email" autoComplete="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
            <p className="text-xs text-muted mt-1.5">{t.book.emailHint}</p>
          </div>
          <div>
            <label className="label" htmlFor="note">{t.book.note}</label>
            <input id="note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </form>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-xl px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1 text-sm leading-tight">
            <div className="font-medium truncate">{summary.title}</div>
            <div className="text-muted truncate">{summary.line}</div>
            {error && <div className="text-danger mt-0.5">{error}</div>}
          </div>
          <button form="book-form" type="submit" className="btn-primary shrink-0" disabled={submitting}>
            {submitting ? t.book.confirming : t.book.confirm}
          </button>
        </div>
      </div>
    </>
  );
}

function StepHeader({ n, title, done, onChange, changeLabel }: { n: number; title: string; done: boolean; onChange?: () => void; changeLabel?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
      <span className={`grid place-items-center size-6 rounded-full text-xs font-semibold ${done ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>
        {done ? "✓" : n}
      </span>
      <h2 className="font-semibold flex-1">{title}</h2>
      {onChange && (
        <button type="button" onClick={onChange} className="text-sm text-accent font-medium cursor-pointer">
          {changeLabel}
        </button>
      )}
    </div>
  );
}
