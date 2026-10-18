"use client";

import { useTransition, ViewTransition } from "react";
import { setLanguage } from "@/app/actions";
import type { Locale } from "@/i18n/dict";
import { ThemeSwitch } from "./ThemeSwitch";

const LABELS: Record<Locale, string> = { me: "MNE", en: "EN" };

export function LanguageSwitch({ current }: { current: Locale }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <ThemeSwitch />
      <div
        className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-xs font-medium"
        aria-busy={pending}
      >
        {(Object.keys(LABELS) as Locale[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => start(() => setLanguage(l))}
            className={`relative isolate rounded-md px-2.5 py-1 transition-colors duration-300 cursor-pointer ${
              l === current ? "text-bg" : "text-muted hover:text-ink"
            }`}
            aria-pressed={l === current}
          >
            {l === current && (
              <ViewTransition name="lang-active">
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-md bg-ink"
                />
              </ViewTransition>
            )}
            {LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
