"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { PhoneMock } from "@/components/PhoneMock";
import type { MockData } from "@/lib/verticals";

/** The phone preview, cross-fading through business types every few seconds. */
export function HeroPhone({ mocks, ...rest }: { mocks: MockData[] } & Omit<ComponentProps<typeof PhoneMock>, "mock">) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % mocks.length), 3600);
    return () => clearInterval(id);
  }, [mocks.length]);
  return (
    <div className="relative">
      {mocks.map((m, n) => (
        <div
          key={n}
          className={`transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${n === 0 ? "" : "absolute inset-0"} ${
            n === i ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[0.97] blur-[2px]"
          }`}
        >
          <PhoneMock mock={m} {...rest} />
        </div>
      ))}
    </div>
  );
}
