"use client";

import { useContext, useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, RotateCcw, Sparkles, Users } from "lucide-react";
import { bookAppointment } from "@/app/actions";
import { PreviewContext } from "./preview";
import type { Dict } from "@/i18n/dict";
import { Odometer } from "@/components/Odometer";
import { formatDuration, formatPrice } from "@/lib/format";

type ServiceOption = { id: string; name: string; durationMinutes: number; priceCents: number | null; capacity: number; staffIds: string[] };
type StaffOption = { id: string; name: string; kind: "person" | "resource"; weekdays: number[] };
type DayOption = { key: string; weekday: number; day: number; month: number };
type T = Pick<Dict, "book" | "common" | "weekdaysShort" | "months">;
type FirstFree = { serviceId: string; iso: string; day: string; time: string };

type Props = {
  slug: string;
  timeZone: string;
  today: string;
  tomorrow: string;
  firstFree: FirstFree | null;
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

export function BookingFlow({ slug, timeZone, today, tomorrow, firstFree, services, staff: allStaff, days, t }: Props) {
  const [serviceId, setServiceId] = useState<string | null>(services.length === 1 ? services[0].id : null);
  const [staffId, setStaffId] = useState<string>(allStaff.length === 1 ? allStaff[0].id : "any");
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  // Free times keyed by service|staff|chunk start, each a map of day → ISO starts
  const [cache, setCache] = useState<Record<string, Record<string, string[]>>>({});
  // Places left per start (ISO), for classes
  const [left, setLeft] = useState<Record<string, number>>({});
  const [selection, setSelection] = useState<{ key: string; slot: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;
  // Only the people/resources that do the chosen service
  const staff = useMemo(
    () => (service && service.staffIds.length ? allStaff.filter((s) => service.staffIds.includes(s.id)) : allStaff),
    [service, allStaff],
  );
  const byResource = staff.length > 0 && staff.every((s) => s.kind === "resource");
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
  const keyFor = (svc: string | null, st: string, date: string) => `${svc}|${st}|${chunkStartOf(date)}`;
  const cacheKey = (date: string) => keyFor(serviceId, staffId, date);
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
      .then((data: { days?: Record<string, string[]>; left?: Record<string, number> }) => {
        setCache((c) => ({ ...c, [key]: data.days ?? {} }));
        if (data.left) setLeft((l) => ({ ...l, ...data.left }));
      })
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
  const dayPhrase = (key: string) => {
    const d = days.find((x) => x.key === key);
    if (!d) return "";
    return key === today || key === tomorrow ? dayLabel(d) : `${dayLabel(d)} ${d.day}. ${t.months[d.month - 1]}`;
  };

  /** The next step the floating pill offers: the earliest free time for the current choice. */
  const nextFree: { day: string; iso: string; serviceId: string; staffId: string } | null = (() => {
    if (!service) {
      return firstFree ? { day: firstFree.day, iso: firstFree.iso, serviceId: firstFree.serviceId, staffId: "any" } : null;
    }
    const from = date ?? today;
    for (const d of openDays) {
      if (d.key < from) continue;
      const s = slotsOn(d.key);
      if (s === undefined) return null; // still loading
      if (s.length) return { day: d.key, iso: s[0], serviceId: service.id, staffId };
    }
    return null;
  })();

  function takeNextFree() {
    if (!nextFree) return;
    setError(null);
    setServiceId(nextFree.serviceId);
    setStaffId(nextFree.staffId);
    setPickedDate(nextFree.day);
    setSelection({ key: `${keyFor(nextFree.serviceId, nextFree.staffId, nextFree.day)}|${nextFree.day}`, slot: nextFree.iso });
  }

  if (services.length === 0) {
    return <p className="card p-6 text-muted text-center">{t.book.noServices}</p>;
  }

  const n = { service: 1, staff: 2, time: staff.length > 1 ? 3 : 2, details: staff.length > 1 ? 4 : 3 };

  return (
    <div className="space-y-4">
      {/* Returning client: one tap to book the same thing */}
      {lastService && !service && (
        <button
          type="button"
          onClick={() => {
            setServiceId(lastService.id);
            setStaffId(lastStaff ? lastStaff.id : "any");
          }}
          className="group w-full text-left card p-4 pr-3 flex items-center gap-4 hover:shadow-lift transition-shadow animate-rise cursor-pointer"
        >
          <span className="grid place-items-center size-11 shrink-0 rounded-full bg-accent text-accent-ink">
            <RotateCcw className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-muted">
              {t.book.welcomeBack}
              {savedName && `, ${savedName}`}
            </span>
            <span className="block font-semibold truncate">
              {lastService.name}
              {lastStaff ? ` · ${lastStaff.name}` : ""}
            </span>
          </span>
          <span className="btn-primary btn-sm shrink-0">
            {t.book.repeat} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      )}

      {/* 1. Service: a grid of frosted tiles */}
      {!service ? (
        <section className="animate-rise [animation-delay:220ms]">
          <h2 className="display text-[22px] text-center mb-4">{t.book.chooseService}</h2>
          <ul className="grid grid-cols-2 gap-3">
            {services.map((s, i) => (
              <li key={s.id} className={services.length % 2 === 1 && i === services.length - 1 ? "col-span-2" : ""}>
                <button
                  type="button"
                  onClick={() => {
                    setServiceId(s.id);
                    if (s.staffIds.length && staffId !== "any" && !s.staffIds.includes(staffId)) setStaffId("any");
                  }}
                  style={{ animationDelay: `${260 + i * 45}ms` }}
                  className="group card-interactive w-full h-full min-h-[112px] p-4 flex flex-col justify-between gap-5 text-left animate-rise"
                >
                  <span>
                    <span className="block text-[15px] font-semibold leading-snug">{s.name}</span>
                    {s.capacity > 1 && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-accent">
                        <Users className="size-3.5" /> {t.book.groupClass}
                      </span>
                    )}
                  </span>
                  <span className="flex items-end justify-between gap-2">
                    <span className="flex items-center gap-1 text-[12.5px] text-muted">
                      <Clock className="size-3.5" />
                      {formatDuration(s.durationMinutes, t.common.minutes)}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums">{formatPrice(s.priceCents, t.common.priceOnRequest)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card p-4 pl-5 flex items-center gap-3 animate-rise">
          <span className="grid place-items-center size-7 shrink-0 rounded-full bg-accent text-accent-ink">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold truncate">{service.name}</span>
            <span className="block text-[13px] text-muted">
              {formatDuration(service.durationMinutes, t.common.minutes)} · {formatPrice(service.priceCents, t.common.priceOnRequest)}
            </span>
          </span>
          {services.length > 1 && (
            <button type="button" onClick={() => setServiceId(null)} className="btn-ghost btn-sm text-accent">
              {t.book.change}
            </button>
          )}
        </section>
      )}

      {/* 2. Staff */}
      {service && staff.length > 1 && (
        <section className="card animate-rise">
          <StepHeader n={n.staff} title={byResource ? t.book.chooseResource : t.book.chooseStaff} done />
          <div className="px-5 pb-5 flex gap-3 overflow-x-auto [scrollbar-width:none]">
            {[{ id: "any", name: byResource ? t.book.anyResource : t.book.anyStaff }, ...staff].map((s) => {
              const active = staffId === s.id;
              return (
                <button key={s.id} type="button" onClick={() => setStaffId(s.id)} className="group shrink-0 w-[76px] flex flex-col items-center gap-2 cursor-pointer">
                  <span
                    className={`grid place-items-center size-14 rounded-full text-[15px] font-bold transition ${
                      active ? "bg-accent text-accent-ink ring-4 ring-accent/20" : "bg-glass-strong border border-[var(--glass-border)] text-ink group-hover:bg-accent-soft"
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
              const known = open ? slotsOn(d.key) : NONE;
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
                        ? "border-[var(--glass-border)] bg-glass-strong backdrop-blur-md hover:border-ink/30"
                        : "border-transparent text-muted/40"
                  }`}
                >
                  <span className="block text-[11px] font-bold uppercase tracking-wide opacity-80 truncate px-1">{dayLabel(d)}</span>
                  <span className="block text-[22px] font-semibold leading-tight tabular-nums">{d.day}</span>
                  <span className="block text-[11px] opacity-75">{t.months[d.month - 1]}</span>
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
                    <div className="grid grid-cols-4 gap-2 stagger">
                      {g.items.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setError(null);
                            if (key && date) setSelection({ key: `${key}|${date}`, slot: s });
                          }}
                          className={`${service.capacity > 1 ? "h-14" : "h-11"} rounded-xl border text-[15px] font-semibold tabular-nums transition active:scale-95 cursor-pointer flex flex-col items-center justify-center leading-tight ${
                            slot === s
                              ? "bg-accent border-accent text-accent-ink shadow-[0_8px_20px_-8px_var(--accent)]"
                              : "border-[var(--glass-border)] bg-glass-strong backdrop-blur-md hover:border-accent hover:text-accent"
                          }`}
                        >
                          {timeFmt.format(new Date(s))}
                          {service.capacity > 1 && left[s] !== undefined && (
                            <span className={`text-[11px] font-semibold ${slot === s ? "opacity-90" : left[s] === 1 ? "text-danger" : "text-muted"}`}>
                              {left[s] === 1 ? t.book.lastPlace : `${left[s]} ${t.book.placesLeft}`}
                            </span>
                          )}
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

      {/* 4. Details, with the pill turning into the confirm button */}
      {service && slot && key && date && (
        <DetailsStep
          n={n.details}
          slug={slug}
          serviceId={service.id}
          staffId={staffId === "any" ? null : staffId}
          slot={slot}
          time={timeFmt.format(new Date(slot))}
          summary={[selectedDay ? dayPhrase(selectedDay.key) : "", formatPrice(service.priceCents, t.common.priceOnRequest), chosenStaff?.name ?? ""]
            .filter(Boolean)
            .join(" · ")}
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
      {error && !slot && <p className="text-danger text-sm text-center animate-pop-in">{error}</p>}

      {/* Floating pill: always the next step, until a time is chosen */}
      {!slot && nextFree && (
        <FloatingPill key={`${nextFree.serviceId}|${nextFree.iso}`}>
          <button type="button" onClick={takeNextFree} className="group flex w-full items-center gap-3 text-left cursor-pointer" aria-label={`${t.book.nextFree}: ${dayPhrase(nextFree.day)} ${timeFmt.format(new Date(nextFree.iso))}`}>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] opacity-80">{t.book.nextFree}</span>
              <span className="block text-[13px] opacity-90 truncate">
                {dayPhrase(nextFree.day)}
                {!service && ` · ${services.find((s) => s.id === nextFree.serviceId)?.name ?? ""}`}
              </span>
            </span>
            <Odometer value={timeFmt.format(new Date(nextFree.iso))} className="display text-[30px] text-[var(--pill-time)]" />
            <span className="grid place-items-center size-12 shrink-0 rounded-full bg-accent text-accent-ink transition-transform group-hover:translate-x-0.5 group-active:scale-95">
              <ArrowRight className="size-5" />
            </span>
          </button>
        </FloatingPill>
      )}
    </div>
  );
}

function FloatingPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-xl rounded-full bg-[var(--pill-bg)] text-[var(--pill-fg)] backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-lift p-2 pl-6 animate-sheet">{children}</div>
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
  time,
  summary,
  t,
  onSlotTaken,
}: {
  n: number;
  slug: string;
  serviceId: string;
  staffId: string | null;
  slot: string;
  time: string;
  summary: string;
  t: T;
  onSlotTaken: () => void;
}) {
  const router = useRouter();
  // Mounted only after a time is picked, so reading saved details is hydration-safe
  const [details, setDetails] = useState<Details>(loadDetails);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const preview = useContext(PreviewContext);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // The invitation preview never saves anything
    if (preview) return preview();
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

      <FloatingPill>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[12.5px] opacity-85 truncate">{summary}</div>
            <Odometer value={time} className="display mt-1 text-[28px] text-[var(--pill-time)]" />
            {error && <div className="text-[12px] text-[var(--pill-error)] mt-1">{error}</div>}
          </div>
          <button form="book-form" type="submit" className="btn-primary h-12 px-5 shrink-0" disabled={submitting}>
            {submitting ? (
              t.book.confirming
            ) : (
              <>
                {t.book.confirm.split(" ")[0]} <Check className="size-4" />
              </>
            )}
          </button>
        </div>
      </FloatingPill>
    </>
  );
}

function StepHeader({ n, title, done }: { n: number; title: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-3">
      <span
        className={`grid place-items-center size-7 rounded-full text-xs font-bold transition-colors ${
          done ? "bg-accent text-accent-ink" : "border border-line text-muted"
        }`}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
      </span>
      <h2 className="display text-[20px] flex-1">{title}</h2>
    </div>
  );
}
