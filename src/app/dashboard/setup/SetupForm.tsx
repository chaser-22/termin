"use client";

import { useActionState, useEffect, useState } from "react";
import type { Dict } from "@/i18n/dict";
import { submitKeepingValues } from "@/lib/form";
import { BUSINESS_TYPES, slugify } from "@/lib/slug";
import { setupBusiness, type FormState } from "../actions";

export function SetupForm({ host, t }: { host: string; t: Pick<Dict, "dash" | "businessTypes" | "common"> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setupBusiness, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const shownSlug = slugEdited ? slug : slugify(name);

  useEffect(() => {
    // A full page load on purpose: a client-side push can reuse a /dashboard
    // prefetched before the business existed, which redirects back to setup.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (state?.ok) window.location.assign("/dashboard");
  }, [state]);

  return (
    <form action={action}
      onSubmit={submitKeepingValues(action)} className="card mt-6 p-6 space-y-5">
      <div>
        <label className="label" htmlFor="type">{t.dash.businessType}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BUSINESS_TYPES.map((type, i) => (
            <label key={type} className="flex items-center justify-center text-center rounded-xl border border-line px-2 h-12 text-sm cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:font-medium">
              <input type="radio" name="type" value={type} defaultChecked={i === 0} className="sr-only" />
              {t.businessTypes[type]}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="name">{t.dash.businessName}</label>
        <input id="name" name="name" required minLength={2} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Berbernica Marko" />
      </div>
      <div>
        <label className="label" htmlFor="slug">{t.dash.slug}</label>
        <div className="flex items-center rounded-xl border border-line bg-surface focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <span className="pl-3.5 text-muted text-[15px] select-none">{host}/</span>
          <input
            id="slug"
            name="slug"
            required
            className="flex-1 h-11 bg-transparent pr-3.5 text-[15px] outline-none"
            value={shownSlug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value.toLowerCase());
            }}
          />
        </div>
        <p className={`text-xs mt-1.5 ${state?.error === "slug" || state?.error === "slugTaken" ? "text-danger" : "text-muted"}`}>
          {state?.error === "slugTaken" ? t.dash.slugTaken : t.dash.slugHint}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="ownerName">{t.dash.yourName}</label>
          <input id="ownerName" name="ownerName" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="city">{t.dash.city}</label>
          <input id="city" name="city" className="input" placeholder="Podgorica" />
        </div>
      </div>
      {state?.error === "invalid" && <p className="text-sm text-danger">{t.common.error}</p>}
      <button className="btn-primary w-full h-12" disabled={pending || !!state?.ok}>
        {pending ? t.common.loading : t.dash.setupSubmit}
      </button>
    </form>
  );
}
