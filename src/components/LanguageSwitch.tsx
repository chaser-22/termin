"use client";

import { useTransition } from "react";
import { setLanguage } from "@/app/actions";
import type { Locale } from "@/i18n/dict";

const LABELS: Record<Locale, string> = { me: "MNE", en: "EN" };

export function LanguageSwitch({ current }: { current: Locale }) {
  const [pending, start] = useTransition();
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-xs font-medium" aria-busy={pending}>
      {(Object.keys(LABELS) as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => start(() => setLanguage(l))}
          className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
            l === current ? "bg-ink text-bg" : "text-muted hover:text-ink"
          }`}
          aria-pressed={l === current}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
