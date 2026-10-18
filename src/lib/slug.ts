// Safe to import from client components.

export const BUSINESS_TYPES = ["barber", "salon", "nails", "beauty", "massage", "dentist", "clinic", "court", "rental", "other"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const RESERVED_SLUGS = new Set([
  "api", "dashboard", "login", "logout", "auth", "booking", "b", "admin", "app", "static",
  "about", "help", "terms", "privacy", "pricing", "settings", "signup", "register", "manifest.webmanifest",
]);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
