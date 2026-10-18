"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_KEY } from "@/lib/theme";

const dark = () => {
  const picked = document.documentElement.dataset.theme;
  return picked ? picked === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
};

function subscribe(onChange: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/** Sun/moon button: switches between light and dark and remembers the choice. */
export function ThemeSwitch() {
  const isDark = useSyncExternalStore(subscribe, dark, () => null);
  const toggle = () => {
    const next = dark() ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
    };
    // A soft cross-fade where the browser supports it
    if (document.startViewTransition && document.visibilityState === "visible" && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(apply);
    else apply();
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Light" : "Dark"}
      className="grid place-items-center size-8 rounded-lg border border-line bg-surface text-muted hover:text-ink transition-colors cursor-pointer"
    >
      {isDark === null ? <span className="size-4" /> : isDark ? <Sun className="size-4 animate-pop-in" /> : <Moon className="size-4 animate-pop-in" />}
    </button>
  );
}
