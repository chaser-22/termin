"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Dict } from "@/i18n/dict";
import { submitKeepingValues } from "@/lib/form";
import { createDashboardBooking, type FormState } from "./actions";

type Props = {
  date: string;
  services: { id: string; name: string; durationMinutes: number }[];
  staff: { id: string; name: string }[];
  defaultTime: string;
  t: Pick<Dict, "dash" | "book" | "common">;
};

export function NewBookingForm({ date, services, staff, defaultTime, t }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(createDashboardBooking, null);
  const formRef = useRef<HTMLFormElement>(null);
  // Collapsed on phones so the calendar stays in view; always open on large screens
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const errorText =
    state?.error === "conflict" ? t.dash.conflict : state?.error === "phone" ? t.book.invalidPhone : state?.error ? t.common.error : null;

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={submitKeepingValues(action)}
      className="card p-4 space-y-3"
    >
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between font-semibold lg:pointer-events-none cursor-pointer">
        {t.dash.newBooking}
        <span className="lg:hidden text-accent text-xl leading-none">{open ? "−" : "+"}</span>
      </button>
      <div className={`space-y-3 ${open ? "" : "hidden lg:block"}`}>
      <input type="hidden" name="date" value={date} />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex items-center gap-2 rounded-xl border border-line px-3 h-10 has-[:checked]:border-accent has-[:checked]:bg-accent-soft cursor-pointer">
          <input type="radio" name="source" value="walk_in" defaultChecked className="accent-[var(--accent)]" /> {t.dash.walkIn}
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-line px-3 h-10 has-[:checked]:border-accent has-[:checked]:bg-accent-soft cursor-pointer">
          <input type="radio" name="source" value="phone" className="accent-[var(--accent)]" /> {t.dash.phoneBooking}
        </label>
      </div>
      <select name="serviceId" className="input" required>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.durationMinutes} {t.common.minutes})
          </option>
        ))}
      </select>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select name="staffId" className="input" required>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input name="time" type="time" step={300} defaultValue={defaultTime} required className="input w-28 tabular-nums" />
      </div>
      <input name="name" className="input" required placeholder={t.book.name} autoComplete="off" />
      <input name="phone" className="input" required type="tel" placeholder={t.book.phone} autoComplete="off" />
      <input name="note" className="input" placeholder={t.book.note} />
      {errorText && <p className="text-sm text-danger">{errorText}</p>}
      {state?.ok && <p className="text-sm text-ok">{t.common.saved}</p>}
      <button className="btn-primary w-full" disabled={pending || services.length === 0}>
        {pending ? t.common.loading : t.dash.create}
      </button>
      </div>
    </form>
  );
}
