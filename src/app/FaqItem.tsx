"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// One common question: the answer slides open and fades in, and slides shut again.
// A closed answer can't be tabbed into. Less motion means it simply appears.
export function FaqItem({ question, children }: { question: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panel = useId();

  return (
    <div data-open={open ? "" : undefined} className="group card px-5 sm:px-6">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen(!open)}
          className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-[15px] sm:text-[16px] font-semibold leading-snug"
        >
          {question}
          <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-300 group-data-[open]:rotate-180 motion-reduce:transition-none" />
        </button>
      </h3>
      <div
        id={panel}
        className="invisible grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity,visibility] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[open]:visible group-data-[open]:grid-rows-[1fr] group-data-[open]:opacity-100 motion-reduce:transition-none"
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pb-5 text-[14px] sm:text-[15px] leading-relaxed text-muted">{children}</p>
        </div>
      </div>
    </div>
  );
}
