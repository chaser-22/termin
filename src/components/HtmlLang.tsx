"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/dict";

const TAGS: Record<Locale, string> = { me: "sr-Latn-ME", en: "en" };

/**
 * Keeps <html lang> (and optionally the tab title) in the visitor's language.
 * The root layout stays static, so this happens once the page is running.
 */
export function HtmlLang({ locale, title }: { locale: Locale; title?: string }) {
  useEffect(() => {
    document.documentElement.lang = TAGS[locale];
    if (title) document.title = title;
  }, [locale, title]);
  return null;
}
