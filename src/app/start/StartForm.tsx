"use client";

import { useActionState, useState } from "react";
import { Check, Mail } from "lucide-react";
import { startTrial, type LoginState } from "@/app/actions";
import type { Dict } from "@/i18n/dict";
import { VerticalIcon } from "@/components/VerticalIcon";
import type { Vertical } from "@/lib/verticals";
import type { BusinessType } from "@/lib/slug";

type Props = {
  invite?: { code: string; name: string };
  defaultType?: BusinessType;
  types: { type: BusinessType; icon: Vertical["icon"]; label: string }[];
  t: Pick<Dict, "trial" | "common" | "auth">;
};

/** Activation: one email field with an invite, three fields without. No password. */
export function StartForm({ invite, defaultType, types, t }: Props) {
  const [state, action, pending] = useActionState<LoginState, FormData>(startTrial, { status: "idle" });
  const [type, setType] = useState<BusinessType>(defaultType ?? types[0].type);
  const [email, setEmail] = useState("");

  if (state.status === "sent") {
    return (
      <div className="text-center animate-rise">
        <span className="mx-auto grid place-items-center size-16 rounded-full bg-accent text-accent-ink animate-pop">
          <Mail className="size-7" />
        </span>
        <h1 className="display text-[34px] mt-6">{t.trial.checkEmail}</h1>
        <p className="mt-2 text-lg text-muted">{t.trial.checkEmailBody}</p>
        <p className="mt-4 text-sm text-muted">{state.email}</p>
        {state.devLink && (
          <div className="mt-6 rounded-xl bg-warn-soft text-warn text-sm p-3.5 space-y-2 text-left">
            <p>{t.auth.devLink}</p>
            <a href={state.devLink} className="btn-primary btn-sm w-full">
              {t.auth.devSignIn} {state.email}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="animate-rise">
      <h1 className="display text-[34px] text-center">{invite ? t.trial.oneStep : t.trial.startTitle}</h1>
      <div className="mt-8 space-y-5">
        {invite ? (
          <>
            <input type="hidden" name="invite" value={invite.code} />
            <p className="card px-4 py-3.5 flex items-center justify-between font-semibold">
              {invite.name} <Check className="size-5 text-ok" />
            </p>
          </>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="name">{t.trial.businessName}</label>
              <input id="name" name="name" required minLength={2} maxLength={80} className="input h-13 text-base" placeholder="Berbernica Marko" />
            </div>
            <fieldset>
              <legend className="label">{t.trial.businessType}</legend>
              <div className="grid grid-cols-3 gap-2">
                {types.map((x) => (
                  <label key={x.type} className="card cursor-pointer px-2 py-3 flex flex-col items-center gap-1.5 text-sm font-semibold has-[:checked]:ring-2 has-[:checked]:ring-accent">
                    <input type="radio" name="type" value={x.type} checked={type === x.type} onChange={() => setType(x.type)} className="sr-only" />
                    <VerticalIcon icon={x.icon} className="size-5 text-accent" />
                    {x.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        <div>
          <label className="label" htmlFor="email">{t.trial.email}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className="input h-13 text-base"
            placeholder="ime@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {state.status === "error" && <p className="text-sm text-danger animate-pop-in">{t.common.error}</p>}
        <button className="btn-primary w-full h-14 text-base" disabled={pending}>
          {pending ? t.common.loading : t.trial.sendLink}
        </button>
        <p className="text-center text-sm text-muted">{t.trial.linkHint}</p>
      </div>
    </form>
  );
}
