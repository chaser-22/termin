"use client";

import { useTransition, ViewTransition } from "react";
import { setLanguage } from "@/app/actions";
import type { Locale } from "@/i18n/dict";
import { HtmlLang } from "./HtmlLang";
import { ThemeSwitch } from "./ThemeSwitch";

const LABELS: Record<Locale, string> = { me: "MNE", en: "EN" };

/** large: a roomier version on desktop (the homepage header); phones stay compact */
export function LanguageSwitch({ current, large }: { current: Locale; large?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className={`flex items-center gap-2 ${large ? "lg:gap-2.5" : ""}`}>
      <HtmlLang locale={current} />
      <ThemeSwitch large={large} />
      <div
        className={`inline-flex rounded-lg border border-line bg-surface p-0.5 text-xs font-medium ${large ? "lg:h-10 lg:rounded-xl lg:p-1 lg:text-[13.5px]" : ""}`}
        aria-busy={pending}
      >
        {(Object.keys(LABELS) as Locale[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => start(() => setLanguage(l))}
            className={`relative isolate rounded-md px-2.5 py-1 transition-colors duration-300 cursor-pointer ${large ? "lg:rounded-lg lg:px-3.5 lg:py-0" : ""} ${
              l === current ? "text-bg" : "text-muted hover:text-ink"
            }`}
            aria-pressed={l === current}
          >
            {l === current && (
              <ViewTransition name="lang-active">
                <span
                  aria-hidden
                  className={`absolute inset-0 -z-10 rounded-md bg-ink ${large ? "lg:rounded-lg" : ""}`}
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
