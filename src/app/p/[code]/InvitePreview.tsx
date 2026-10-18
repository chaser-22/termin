"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { PreviewContext } from "@/app/[slug]/preview";

/** Wraps the live booking page: nothing is saved, and finishing it leads to activation. */
export function InvitePreview({ children, startHref, t }: { children: ReactNode; startHref: string; t: { previewNote: string; previewDone: string; useThis: string } }) {
  const [done, setDone] = useState(false);
  return (
    <PreviewContext.Provider value={() => setDone(true)}>
      {done ? (
        <section ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mx-auto max-w-xl px-4 py-16 text-center animate-rise">
          <p className="text-lg font-semibold">{t.previewDone}</p>
          <Link href={startHref} className="mt-6 btn-primary w-full h-14 text-base">
            {t.useThis} <ArrowRight className="size-4" />
          </Link>
        </section>
      ) : (
        <>
          <div className="mx-auto max-w-xl px-4">
            <p className="flex items-center justify-center gap-2 rounded-full bg-accent-soft text-accent text-sm font-semibold py-2">
              <Eye className="size-4" /> {t.previewNote}
            </p>
          </div>
          {children}
          <div className="mx-auto max-w-xl px-4 -mt-24 pb-10">
            <Link href={startHref} className="btn-secondary w-full h-13 text-base">
              {t.useThis} <ArrowRight className="size-4" />
            </Link>
          </div>
        </>
      )}
    </PreviewContext.Provider>
  );
}
