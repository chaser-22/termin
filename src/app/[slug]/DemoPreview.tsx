"use client";

import { useState, type ReactNode } from "react";
import { Check, RotateCcw } from "lucide-react";
import { PreviewContext } from "./preview";

/** The example booking page shown inside an industry page: marked as an example, saves nothing. */
export function DemoPreview({ children, t }: { children: ReactNode; t: { exampleBadge: string; previewDone: string; tryAgain: string } }) {
  const [done, setDone] = useState(false);
  return (
    <PreviewContext.Provider value={() => setDone(true)}>
      {/* Shown inside a phone frame: no desktop scrollbar */}
      <style>{"html{scrollbar-width:none}html::-webkit-scrollbar{display:none}"}</style>
      <p className="sticky top-0 z-30 mx-auto w-fit mt-3 rounded-full bg-ink/85 text-bg backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
        {t.exampleBadge}
      </p>
      {done ? (
        <div className="flex-1 grid place-items-center px-6 py-20 text-center animate-rise">
          <div>
            <span className="mx-auto grid place-items-center size-16 rounded-full bg-accent text-accent-ink animate-pop">
              <Check className="size-8" />
            </span>
            <p className="mt-6 text-lg font-semibold">{t.previewDone}</p>
            <button type="button" onClick={() => setDone(false)} className="mt-6 btn-secondary">
              <RotateCcw className="size-4" /> {t.tryAgain}
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </PreviewContext.Provider>
  );
}
