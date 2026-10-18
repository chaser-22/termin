"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { PhoneMock } from "@/components/PhoneMock";
import type { MockData } from "@/lib/verticals";

/** The phone preview, turning through business types every few seconds. */
export function HeroPhone({ mocks, ...rest }: { mocks: MockData[] } & Omit<ComponentProps<typeof PhoneMock>, "mock">) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % mocks.length), 3200);
    return () => clearInterval(id);
  }, [mocks.length]);
  return (
    // Drawn at full size, shown smaller so it fits the first screen of a phone
    <div className="h-[400px] sm:h-[460px] flex justify-center">
      <div className="origin-top scale-[0.72] sm:scale-[0.82]">
        <div key={i} className="animate-pop-in">
          <PhoneMock mock={mocks[i]} {...rest} />
        </div>
      </div>
    </div>
  );
}
