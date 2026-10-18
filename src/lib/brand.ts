// Curated brand colors a business can pick. Each has a light and a dark-mode
// variant tuned for contrast against the app's ivory / near-black surfaces.

type Shade = { accent: string; hover: string; soft: string; ink: string };
export type Brand = { name: { me: string; en: string }; light: Shade; dark: Shade };

export const BRANDS = {
  adriatic: {
    name: { me: "Jadran", en: "Adriatic" },
    light: { accent: "#0e5a63", hover: "#0a474e", soft: "#e2eeee", ink: "#ffffff" },
    dark: { accent: "#6fc0c7", hover: "#8ed1d6", soft: "#16343a", ink: "#08191b" },
  },
  noir: {
    name: { me: "Noir", en: "Noir" },
    light: { accent: "#16140f", hover: "#2b2820", soft: "#ebe6dc", ink: "#fffdf9" },
    dark: { accent: "#f3eee5", hover: "#ffffff", soft: "#2a2721", ink: "#16140f" },
  },
  bordeaux: {
    name: { me: "Bordo", en: "Bordeaux" },
    light: { accent: "#7a2335", hover: "#621b2a", soft: "#f5e5e7", ink: "#ffffff" },
    dark: { accent: "#e58a9b", hover: "#eea3b1", soft: "#3a1820", ink: "#24080e" },
  },
  olive: {
    name: { me: "Maslina", en: "Olive" },
    light: { accent: "#4a5a24", hover: "#3a471c", soft: "#ebeedd", ink: "#ffffff" },
    dark: { accent: "#b5c77c", hover: "#c6d595", soft: "#283017", ink: "#151a07" },
  },
  cobalt: {
    name: { me: "Kobalt", en: "Cobalt" },
    light: { accent: "#24429a", hover: "#1b337a", soft: "#e4e9f6", ink: "#ffffff" },
    dark: { accent: "#8fa8f0", hover: "#a9bdf4", soft: "#1a2546", ink: "#0a1230" },
  },
  rose: {
    name: { me: "Ruža", en: "Rose" },
    light: { accent: "#a13d5f", hover: "#86304e", soft: "#f8e7ed", ink: "#ffffff" },
    dark: { accent: "#f09ab7", hover: "#f5b2c8", soft: "#3b1826", ink: "#2a0815" },
  },
  gold: {
    name: { me: "Zlato", en: "Gold" },
    light: { accent: "#87631a", hover: "#6d5014", soft: "#f5ecd8", ink: "#ffffff" },
    dark: { accent: "#e2bd6a", hover: "#eacb87", soft: "#33280f", ink: "#211703" },
  },
} satisfies Record<string, Brand>;

export type BrandKey = keyof typeof BRANDS;
export const BRAND_KEYS = Object.keys(BRANDS) as BrandKey[];

export function isBrandKey(value: string | null | undefined): value is BrandKey {
  return !!value && value in BRANDS;
}

/** CSS that sets the accent variables for a page section, in both color schemes. */
export function brandCss(key: string | null | undefined, selector = ":root"): string {
  const b = BRANDS[isBrandKey(key) ? key : "adriatic"];
  const vars = (s: Shade) => `--accent:${s.accent};--accent-hover:${s.hover};--accent-soft:${s.soft};--accent-ink:${s.ink};`;
  // Dark follows the device unless a theme was picked (data-theme on <html>)
  const on = (root: string) => (selector === ":root" ? root : `${root} ${selector}`);
  return `${selector}{${vars(b.light)}}@media (prefers-color-scheme:dark){${on(':root:not([data-theme="light"])')}{${vars(b.dark)}}}${on(':root[data-theme="dark"]')}{${vars(b.dark)}}`;
}
