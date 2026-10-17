"use client";

import { useActionState } from "react";
import { requestLoginLink, type LoginState } from "@/app/actions";
import type { Dict } from "@/i18n/dict";

export function LoginForm({ t }: { t: Pick<Dict, "auth" | "common"> }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLoginLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="mt-6 space-y-3">
        <p className="font-medium">{t.auth.checkEmail}</p>
        <p className="text-sm text-muted">
          {t.auth.checkEmailBody} <span className="text-ink font-medium">{state.email}</span>
        </p>
        {state.devLink && (
          <div className="rounded-xl bg-warn-soft text-warn text-sm p-3.5 space-y-2">
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
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="label">{t.auth.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="ime@salon.me" />
      </div>
      {state.status === "error" && <p className="text-sm text-danger">{t.common.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? t.common.loading : t.auth.sendLink}
      </button>
    </form>
  );
}
