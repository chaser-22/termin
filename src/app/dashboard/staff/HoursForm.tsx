"use client";

import { useActionState, useState } from "react";
import type { Dict } from "@/i18n/dict";
import { submitKeepingValues } from "@/lib/form";
import { saveHours, type FormState } from "../actions";

export type DayHours = { open: boolean; from: string; to: string; breakFrom: string; breakTo: string };

export function HoursForm({ staffId, days, t }: { staffId: string; days: DayHours[]; t: Pick<Dict, "dash" | "common" | "weekdays"> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveHours, null);
  const [open, setOpen] = useState(days.map((d) => d.open));
  const [showBreak, setShowBreak] = useState(days.map((d) => d.breakFrom !== ""));

  return (
    <form action={action}
      onSubmit={submitKeepingValues(action)} className="p-4 space-y-2">
      <input type="hidden" name="staffId" value={staffId} />
      {days.map((day, i) => {
        const w = i + 1;
        return (
          <div key={w} className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] items-center gap-3 min-h-11">
            <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                name={`open-${w}`}
                checked={open[i]}
                onChange={(e) => setOpen(open.map((v, j) => (j === i ? e.target.checked : v)))}
                className="size-4 accent-[var(--accent)]"
              />
              {t.weekdays[i]}
            </label>
            {open[i] ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <input name={`from-${w}`} type="time" step={300} defaultValue={day.from} className="input h-9 w-28 tabular-nums" aria-label={t.dash.from} />
                <span className="text-muted">–</span>
                <input name={`to-${w}`} type="time" step={300} defaultValue={day.to} className="input h-9 w-28 tabular-nums" aria-label={t.dash.to} />
                {showBreak[i] ? (
                  <span className="flex items-center gap-2 text-muted">
                    ⏸
                    <input name={`bfrom-${w}`} type="time" step={300} defaultValue={day.breakFrom || "13:00"} className="input h-9 w-28 tabular-nums" />
                    –
                    <input name={`bto-${w}`} type="time" step={300} defaultValue={day.breakTo || "14:00"} className="input h-9 w-28 tabular-nums" />
                    <button type="button" className="text-muted hover:text-ink px-1 cursor-pointer" onClick={() => setShowBreak(showBreak.map((v, j) => (j === i ? false : v)))}>
                      ×
                    </button>
                  </span>
                ) : (
                  <button type="button" className="text-accent text-sm font-medium cursor-pointer" onClick={() => setShowBreak(showBreak.map((v, j) => (j === i ? true : v)))}>
                    + {t.dash.addBreak}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted">{t.dash.dayOff}</span>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-2">
        <button className="btn-primary btn-sm" disabled={pending}>{pending ? t.common.loading : t.common.save}</button>
        {state?.ok && <span className="text-sm text-ok">{t.common.saved}</span>}
        {state?.error && <span className="text-sm text-danger">{t.dash.invalidHours}</span>}
      </div>
    </form>
  );
}
