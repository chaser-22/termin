"use client";

import { useActionState } from "react";
import type { Dict } from "@/i18n/dict";
import { submitKeepingValues } from "@/lib/form";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/slug";
import { BRANDS, BRAND_KEYS } from "@/lib/brand";
import type { Locale } from "@/i18n/dict";
import { saveSettings, type FormState } from "../actions";

type Values = {
  name: string;
  slug: string;
  type: BusinessType;
  phone: string;
  address: string;
  city: string;
  description: string;
  minNoticeMinutes: number;
  maxDaysAhead: number;
  slotStepMinutes: number;
  brandColor: string;
};

export function SettingsForm({ host, business: b, locale, t }: { host: string; business: Values; locale: Locale; t: Pick<Dict, "dash" | "common" | "businessTypes"> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettings, null);
  return (
    <form action={action}
      onSubmit={submitKeepingValues(action)} className="card p-5 space-y-5">
        <Field label={t.dash.businessName}>
          <input name="name" required defaultValue={b.name} className="input" />
        </Field>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label={t.dash.phone}>
          <input name="phone" type="tel" defaultValue={b.phone} className="input" placeholder="+382 67 123 456" />
        </Field>
        <Field label={t.dash.address}>
          <input name="address" defaultValue={b.address} className="input" />
        </Field>
        <Field label={t.dash.city}>
          <input name="city" defaultValue={b.city} className="input" />
        </Field>
      </div>
      <div>
        <span className="label">{t.dash.brandColor}</span>
        <div className="flex flex-wrap gap-2.5">
          {BRAND_KEYS.map((k) => (
            <label key={k} className="group cursor-pointer" title={BRANDS[k].name[locale]}>
              <input type="radio" name="brandColor" value={k} defaultChecked={b.brandColor === k} className="peer sr-only" />
              <span
                className="block size-10 rounded-full ring-offset-2 ring-offset-surface transition peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-accent group-hover:scale-105"
                style={{ background: BRANDS[k].light.accent }}
              />
              <span className="mt-1 block text-center text-[11px] text-muted">{BRANDS[k].name[locale]}</span>
            </label>
          ))}
        </div>
      </div>
      <details className="group rounded-xl border border-line px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-muted list-none">{t.dash.moreOptions}</summary>
        <div className="mt-4 space-y-5">
        <Field label={t.dash.businessType}>
          <select name="type" defaultValue={b.type} className="input">
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>{t.businessTypes[type]}</option>
            ))}
          </select>
        </Field>
      <Field label={t.dash.slug} hint={state?.error === "slugTaken" ? t.dash.slugTaken : t.dash.slugHint} error={state?.error === "slug" || state?.error === "slugTaken"}>
        <div className="flex items-center rounded-xl border border-line bg-surface focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <span className="pl-3.5 text-muted text-[15px] select-none">{host}/</span>
          <input name="slug" required defaultValue={b.slug} className="flex-1 h-11 bg-transparent pr-3.5 text-[15px] outline-none" />
        </div>
      </Field>
      <Field label={t.dash.description}>
        <textarea name="description" defaultValue={b.description} maxLength={300} rows={2} className="input h-auto py-2.5" />
      </Field>
      <div>
        <p className="font-semibold mb-3">{t.dash.rules}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={t.dash.minNotice}>
            <input name="minNotice" type="number" min={0} defaultValue={b.minNoticeMinutes} className="input tabular-nums" />
          </Field>
          <Field label={t.dash.maxDays}>
            <input name="maxDays" type="number" min={1} max={365} defaultValue={b.maxDaysAhead} className="input tabular-nums" />
          </Field>
          <Field label={t.dash.slotStep}>
            <select name="slotStep" defaultValue={b.slotStepMinutes} className="input">
              {[5, 10, 15, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
        </div>
      </details>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? t.common.loading : t.common.save}</button>
        {state?.ok && <span className="text-sm text-ok animate-pop-in">{t.common.saved}</span>}
        {state?.error === "invalid" && <span className="text-sm text-danger animate-pop-in">{t.common.error}</span>}
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint && <p className={`text-xs mt-1.5 ${error ? "text-danger" : "text-muted"}`}>{hint}</p>}
    </div>
  );
}
