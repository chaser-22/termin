import "server-only";
import { headers } from "next/headers";
import { readCookie } from "@/lib/server/cookies";
import { DICTS, isLocale, type Locale } from "./dict";

// Ex-Yugoslav languages read Montenegrin fine; everyone else gets English.
const LOCAL_LANGS = ["sr", "me", "cnr", "bs", "hr", "sh"];

export async function getLocale(): Promise<Locale> {
  const fromCookie = await readCookie("lang");
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().slice(0, 3).toLowerCase() ?? "";
  if (!first) return "me";
  return LOCAL_LANGS.some((l) => first.startsWith(l)) ? "me" : "en";
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: DICTS[locale] };
}
