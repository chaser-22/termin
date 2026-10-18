"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { SETUP_TYPE_KEY } from "@/app/StartLink";
import type { Dict } from "@/i18n/dict";
import { submitKeepingValues } from "@/lib/form";
import { BUSINESS_TYPES } from "@/lib/slug";
import { setupBusiness, type FormState } from "../actions";

export function SetupForm({ t }: { t: Pick<Dict, "dash" | "businessTypes" | "common"> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setupBusiness, null);
  const [name, setName] = useState("");
  // The type picked on the homepage (remembered in this browser) is the default
  const stored = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(SETUP_TYPE_KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const [picked, setPicked] = useState<string | null>(null);
  const type = picked ?? (stored && (BUSINESS_TYPES as readonly string[]).includes(stored) ? stored : BUSINESS_TYPES[0]);
  const selected = type;

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
          {BUSINESS_TYPES.map((type) => (
            <label key={type} className="flex items-center justify-center text-center rounded-xl border border-line px-2 h-12 text-sm cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:font-medium">
              <input type="radio" name="type" value={type} checked={selected === type} className="sr-only" onChange={() => setPicked(type)} />
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
        <label className="label" htmlFor="city">{t.dash.city}</label>
        <input id="city" name="city" className="input" placeholder="Podgorica" />
      </div>
      {state?.error === "invalid" && <p className="text-sm text-danger animate-pop-in">{t.common.error}</p>}
      <button className="btn-primary w-full h-12" disabled={pending || !!state?.ok}>
        {pending ? t.common.loading : t.dash.setupSubmit}
      </button>
    </form>
  );
}
