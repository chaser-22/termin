"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, RotateCcw, Sparkles, Zap } from "lucide-react";
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
  today: string;
  tomorrow: string;
  firstFree: { day: string; time: string } | null;
  services: ServiceOption[];
  staff: StaffOption[];
  days: DayOption[];
  t: T;
};

// Free times are fetched two weeks at a time
const CHUNK_DAYS = 14;
const NONE: string[] = [];

// ------------------------------------------------------------ remembered on this device

type Details = { name: string; phone: string; email: string };
type LastBooking = { serviceId: string; staffId: string | null };
const DETAILS_KEY = "termin:details";
const lastKey = (slug: string) => `termin:last:${slug}`;

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function parse<V>(raw: string | null): V | null {
  try {
    return raw ? (JSON.parse(raw) as V) : null;
  } catch {
    return null;
  }
}
const noSubscribe = () => () => {};
/** Reads a stored value after hydration (null on the server and first render). */
function useStored(key: string): string | null {
  return useSyncExternalStore(noSubscribe, () => readStorage(key), () => null);
}

function loadDetails(): Details {
  return { name: "", phone: "", email: "", ...parse<Details>(readStorage(DETAILS_KEY)) };
}

// Stable ref callback: scrolls once when the element mounts, not on every render
function scrollIntoViewOnMount(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ------------------------------------------------------------ flow

export function BookingFlow({ slug, timeZone, today, tomorrow, firstFree, services, staff, days, t }: Props) {
  const [serviceId, setServiceId] = useState<string | null>(services.length === 1 ? services[0].id : null);
  const [staffId, setStaffId] = useState<string>(staff.length === 1 ? staff[0].id : "any");
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  // Free times keyed by service|staff|chunk start, each a map of day → ISO starts
  const [cache, setCache] = useState<Record<string, Record<string, string[]>>>({});
  const [selection, setSelection] = useState<{ key: string; slot: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const chosenStaff = staff.find((s) => s.id === staffId) ?? null;

  const savedName = parse<Details>(useStored(DETAILS_KEY))?.name?.split(" ")[0] ?? "";
  const last = parse<LastBooking>(useStored(lastKey(slug)));
  const lastService = last ? services.find((s) => s.id === last.serviceId) : undefined;
  const lastStaff = last?.staffId ? staff.find((s) => s.id === last.staffId) : undefined;

  const openDays = useMemo(() => {
    const open = new Set<number>();
    for (const s of staff) if (staffId === "any" || s.id === staffId) s.weekdays.forEach((w) => open.add(w));
    return days.filter((d) => open.has(d.weekday));
  }, [staff, staffId, days]);

  const chunkStartOf = (date: string) => {
    const i = days.findIndex((d) => d.key === date);
    return days[Math.max(0, Math.floor(i / CHUNK_DAYS) * CHUNK_DAYS)]?.key ?? date;
  };
  const cacheKey = (date: string) => `${serviceId}|${staffId}|${chunkStartOf(date)}`;
  /** Free times on a day, or undefined while not loaded. */
  const slotsOn = (date: string): string[] | undefined => {
    const chunk = cache[cacheKey(date)];
    return chunk ? (chunk[date] ?? NONE) : undefined;
  };

  // Chosen day, or else the first open day not already known to be full
  const date = (() => {
    if (pickedDate && openDays.some((d) => d.key === pickedDate)) return pickedDate;
    for (const d of openDays) {
      const s = slotsOn(d.key);
      if (s === undefined || s.length > 0) return d.key;
    }
    return openDays[0]?.key ?? null;
  })();

  const key = date ? cacheKey(date) : null;
  const slots = date ? (slotsOn(date) ?? null) : NONE;
  const slot = selection && date && selection.key === `${key}|${date}` ? selection.slot : null;
  const selectedDay = days.find((d) => d.key === date) ?? null;

  useEffect(() => {
    if (!service || !date || !key || cache[key] !== undefined) return;
    const from = key.split("|")[2];
    const ctrl = new AbortController();
    fetch(`/api/slots?b=${encodeURIComponent(slug)}&s=${service.id}&st=${staffId}&d=${from}&days=${CHUNK_DAYS}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { days?: Record<string, string[]> }) => setCache((c) => ({ ...c, [key]: data.days ?? {} })))
      .catch((e) => {
        if (e.name !== "AbortError") setCache((c) => ({ ...c, [key]: {} }));
      });
    return () => ctrl.abort();
  }, [slug, service, staffId, date, key, cache]);

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }),
    [timeZone],
  );

  const groups = useMemo(() => {
    const g: { label: string; items: string[] }[] = [
      { label: t.book.morning, items: [] },
      { label: t.book.afternoon, items: [] },
      { label: t.book.evening, items: [] },
    ];
    for (const s of slots ?? []) {
      const h = Number(timeFmt.format(new Date(s)).slice(0, 2));
      g[h < 12 ? 0 : h < 17 ? 1 : 2].items.push(s);
    }
    return g.filter((x) => x.items.length);
  }, [slots, timeFmt, t]);

  const dayLabel = (d: DayOption) => (d.key === today ? t.common.today : d.key === tomorrow ? t.common.tomorrow : t.weekdaysShort[d.weekday - 1]);
  const firstFreeDay = firstFree ? days.find((x) => x.key === firstFree.day) : undefined;
  const firstFreeLabel =
    firstFree && firstFreeDay
      ? `${firstFree.day === today || firstFree.day === tomorrow ? dayLabel(firstFreeDay).toLowerCase() : `${dayLabel(firstFreeDay)} ${firstFreeDay.day}.`} ${firstFree.time}`
      : null;

  if (services.length === 0) {
    return <p className="card p-6 text-muted">{t.book.noServices}</p>;
  }

  const n = { service: 1, staff: 2, time: staff.length > 1 ? 3 : 2, details: staff.length > 1 ? 4 : 3 };

  return (
    <div className={`space-y-4 ${slot ? "pb-36" : ""}`}>
      {/* Returning customer: one tap to book the same thing */}
      {lastService && !service && (
        <button
          type="button"
          onClick={() => {
            setServiceId(lastService.id);
            setStaffId(lastStaff ? lastStaff.id : "any");
          }}
          className="group w-full text-left card p-4 pr-3 flex items-center gap-4 border-accent/30 bg-gradient-to-br from-accent-soft to-surface hover:shadow-lift transition-shadow animate-rise cursor-pointer"
        >
          <span className="grid place-items-center size-11 shrink-0 rounded-2xl bg-accent text-accent-ink">
            <RotateCcw className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-muted">
              {t.book.welcomeBack}
              {savedName && `, ${savedName}`}
            </span>
            <span className="block font-medium truncate">
              {lastService.name}
              {lastStaff ? ` · ${lastStaff.name}` : ""}
            </span>
          </span>
          <span className="btn-primary btn-sm shrink-0">
            {t.book.repeat} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      )}

      {/* 1. Service */}
      <section className="card overflow-hidden animate-rise [animation-delay:150ms]">
        <StepHeader
          n={n.service}
          title={t.book.chooseService}
          done={!!service}
          onChange={services.length > 1 && service ? () => setServiceId(null) : undefined}
          changeLabel={t.book.change}
        />
        {!service && firstFreeLabel && (
          <p className="mx-5 -mt-1 mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            <Zap className="size-3.5" />
            {t.book.nextFree}: {firstFreeLabel}
          </p>
        )}
        {service ? (
          <div className="px-5 pb-5 flex items-baseline justify-between gap-4">
            <span className="text-[17px] font-medium">{service.name}</span>
            <span className="text-sm text-muted whitespace-nowrap">
              {formatDuration(service.durationMinutes, t.common.minutes)} ·{" "}
              <span className="text-ink font-medium">{formatPrice(service.priceCents, t.common.priceOnRequest)}</span>
            </span>
          </div>
        ) : (
          <ul className="px-2 pb-2">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className="group w-full flex items-center justify-between gap-4 rounded-2xl px-3.5 py-3.5 text-left hover:bg-surface-2 active:scale-[0.99] transition cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block text-[16px] font-medium">{s.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                      <Clock className="size-3.5" />
                      {formatDuration(s.durationMinutes, t.common.minutes)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="font-medium tabular-nums">{formatPrice(s.priceCents, t.common.priceOnRequest)}</span>
                    <span className="grid place-items-center size-8 rounded-full border border-line text-muted group-hover:bg-accent group-hover:border-accent group-hover:text-accent-ink transition-colors">
                      <ArrowRight className="size-4" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. Staff */}
      {service && staff.length > 1 && (
        <section className="card animate-rise">
          <StepHeader n={n.staff} title={t.book.chooseStaff} done />
          <div className="px-5 pb-5 flex gap-3 overflow-x-auto [scrollbar-width:none]">
            {[{ id: "any", name: t.book.anyStaff }, ...staff].map((s) => {
              const active = staffId === s.id;
              return (
                <button key={s.id} type="button" onClick={() => setStaffId(s.id)} className="group shrink-0 w-[76px] flex flex-col items-center gap-2 cursor-pointer">
                  <span
                    className={`grid place-items-center size-14 rounded-full text-[15px] font-semibold transition ${
                      active ? "bg-accent text-accent-ink ring-4 ring-accent/20" : "bg-surface-2 text-ink group-hover:bg-accent-soft"
                    }`}
                  >
                    {s.id === "any" ? <Sparkles className="size-5" /> : initials(s.name)}
                  </span>
                  <span className={`text-[13px] leading-tight text-center ${active ? "font-semibold" : "text-muted"}`}>{s.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Date and time */}
      {service && (
        <section className="card animate-rise">
          <StepHeader n={n.time} title={t.book.chooseTime} done={!!slot} />
          <div className="flex gap-2 overflow-x-auto px-5 pb-4 snap-x [scrollbar-width:none]">
            {days.map((d) => {
              const open = openDays.includes(d);
              const known = open ? slotsOn(d.key) : [];
              const full = known !== undefined && known.length === 0;
              const selected = d.key === date;
              return (
                <button
                  key={d.key}
                  type="button"
                  disabled={!open || full}
                  onClick={() => setPickedDate(d.key)}
                  className={`relative snap-start shrink-0 w-[58px] pt-2 pb-3 rounded-2xl border text-center transition cursor-pointer disabled:cursor-default ${
                    selected
                      ? "bg-ink border-ink text-bg shadow-lift"
                      : open && !full
                        ? "border-line bg-surface hover:border-ink/40"
                        : "border-transparent text-muted/40"
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-70 truncate px-1">{dayLabel(d)}</span>
                  <span className="block text-[22px] font-medium leading-tight tabular-nums">{d.day}</span>
                  <span className="block text-[10px] opacity-60">{t.months[d.month - 1]}</span>
                  {known && known.length > 0 && (
                    <span className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full ${selected ? "bg-bg" : "bg-accent"}`} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-5 pb-5 min-h-28">
            {slots === null ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-xl bg-surface-2 animate-pulse" style={{ animationDelay: `${i * 40}ms` }} />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-muted py-8 text-center">{t.book.noSlots}</p>
            ) : (
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.label}>
                    <p className="eyebrow mb-2">{g.label}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {g.items.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setError(null);
                            if (key && date) setSelection({ key: `${key}|${date}`, slot: s });
                          }}
                          className={`h-11 rounded-xl border text-[15px] font-medium tabular-nums transition active:scale-95 cursor-pointer ${
                            slot === s
                              ? "bg-accent border-accent text-accent-ink shadow-[0_8px_20px_-8px_var(--accent)]"
                              : "border-line bg-surface hover:border-accent hover:text-accent"
                          }`}
                        >
                          {timeFmt.format(new Date(s))}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Details + confirm bar */}
      {service && slot && key && date && (
        <DetailsStep
          n={n.details}
          slug={slug}
          serviceId={service.id}
          staffId={staffId === "any" ? null : staffId}
          slot={slot}
          summary={{
            title: service.name,
            line: `${selectedDay ? `${dayLabel(selectedDay)}, ${selectedDay.day}. ${t.months[selectedDay.month - 1]} · ` : ""}${timeFmt.format(new Date(slot))}${chosenStaff ? ` · ${chosenStaff.name}` : ""}`,
            price: formatPrice(service.priceCents, t.common.priceOnRequest),
          }}
          t={t}
          onSlotTaken={() => {
            setError(t.book.slotTaken);
            setSelection(null);
            // Drop the stale times so they load again
            setCache((c) => {
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

// ------------------------------------------------------------ details

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
  summary: { title: string; line: string; price: string };
  t: T;
  onSlotTaken: () => void;
}) {
  const router = useRouter();
  // Mounted only after a time is picked, so reading saved details is hydration-safe
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
        writeStorage(DETAILS_KEY, details);
        writeStorage(lastKey(slug), { serviceId, staffId } satisfies LastBooking);
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
      <section ref={scrollIntoViewOnMount} className="card scroll-mt-4 animate-rise">
        <StepHeader n={n} title={t.book.yourDetails} done={false} />
        <form id="book-form" onSubmit={submit} className="px-5 pb-6 space-y-4">
          <div>
            <label className="label" htmlFor="name">{t.book.name}</label>
            <input id="name" className="input" required minLength={2} autoComplete="name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="phone">{t.book.phone}</label>
            <input
              id="phone"
              className="input tabular-nums"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="067 123 456"
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            />
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

      <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-xl rounded-[28px] bg-ink text-bg shadow-lift p-2 pl-5 flex items-center gap-3 animate-rise">
          <div className="min-w-0 flex-1 py-1.5 leading-tight">
            <div className="flex items-baseline gap-2">
              <span className="font-medium truncate">{summary.title}</span>
              <span className="text-sm opacity-70 tabular-nums shrink-0">{summary.price}</span>
            </div>
            <div className="text-[13px] opacity-70 truncate">{summary.line}</div>
            {error && <div className="text-[13px] text-[#ff9b8a] mt-0.5">{error}</div>}
          </div>
          <button form="book-form" type="submit" className="btn-primary h-12 px-5 shrink-0" disabled={submitting}>
            {submitting ? (
              t.book.confirming
            ) : (
              <>
                {t.book.confirm} <Check className="size-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function StepHeader({
  n,
  title,
  done,
  onChange,
  changeLabel,
}: {
  n: number;
  title: string;
  done: boolean;
  onChange?: () => void;
  changeLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-3">
      <span
        className={`grid place-items-center size-7 rounded-full text-xs font-semibold transition-colors ${
          done ? "bg-accent text-accent-ink" : "border border-line text-muted"
        }`}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
      </span>
      <h2 className="display text-[24px] flex-1">{title}</h2>
      {onChange && (
        <button type="button" onClick={onChange} className="text-sm text-accent font-medium cursor-pointer hover:underline underline-offset-4">
          {changeLabel}
        </button>
      )}
    </div>
  );
}
