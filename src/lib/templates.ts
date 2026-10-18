import type { BusinessType } from "@/db/schema";
import type { Locale } from "@/i18n/dict";

type TemplateService = { me: string; en: string; minutes: number; price: number | null };

// Starter services per business type, so setup takes minutes. Prices in EUR.
export const SERVICE_TEMPLATES: Record<BusinessType, TemplateService[]> = {
  barber: [
    { me: "Muško šišanje", en: "Men's haircut", minutes: 30, price: 10 },
    { me: "Šišanje i brada", en: "Haircut and beard", minutes: 45, price: 15 },
    { me: "Uređivanje brade", en: "Beard trim", minutes: 15, price: 5 },
    { me: "Dječije šišanje", en: "Kids' haircut", minutes: 20, price: 7 },
  ],
  salon: [
    { me: "Žensko šišanje", en: "Women's haircut", minutes: 45, price: 20 },
    { me: "Feniranje", en: "Blow-dry", minutes: 30, price: 12 },
    { me: "Farbanje", en: "Hair colouring", minutes: 90, price: 40 },
    { me: "Pramenovi", en: "Highlights", minutes: 120, price: 60 },
  ],
  nails: [
    { me: "Manikir", en: "Manicure", minutes: 45, price: 15 },
    { me: "Gel lak", en: "Gel polish", minutes: 60, price: 20 },
    { me: "Izlivanje noktiju", en: "Nail extensions", minutes: 90, price: 35 },
    { me: "Pedikir", en: "Pedicure", minutes: 60, price: 25 },
  ],
  beauty: [
    { me: "Tretman lica", en: "Facial", minutes: 60, price: 35 },
    { me: "Depilacija", en: "Waxing", minutes: 30, price: 15 },
    { me: "Oblikovanje obrva", en: "Brow shaping", minutes: 20, price: 8 },
    { me: "Šminkanje", en: "Make-up", minutes: 60, price: 30 },
  ],
  massage: [
    { me: "Relaks masaža 30 min", en: "Relaxing massage 30 min", minutes: 30, price: 20 },
    { me: "Relaks masaža 60 min", en: "Relaxing massage 60 min", minutes: 60, price: 35 },
    { me: "Sportska masaža", en: "Sports massage", minutes: 60, price: 40 },
  ],
  dentist: [
    { me: "Pregled", en: "Check-up", minutes: 30, price: 20 },
    { me: "Uklanjanje kamenca", en: "Scale and polish", minutes: 45, price: 40 },
    { me: "Plomba", en: "Filling", minutes: 60, price: null },
    { me: "Izbjeljivanje zuba", en: "Teeth whitening", minutes: 60, price: 150 },
  ],
  clinic: [
    { me: "Pregled", en: "Consultation", minutes: 30, price: null },
    { me: "Kontrolni pregled", en: "Follow-up visit", minutes: 20, price: null },
    { me: "Ultrazvuk", en: "Ultrasound", minutes: 30, price: null },
  ],
  court: [
    { me: "Teren 60 min", en: "Court 60 min", minutes: 60, price: 20 },
    { me: "Teren 90 min", en: "Court 90 min", minutes: 90, price: 28 },
    { me: "Teren 120 min", en: "Court 120 min", minutes: 120, price: 36 },
  ],
  rental: [
    { me: "Iznajmljivanje 1 sat", en: "Rental 1 hour", minutes: 60, price: 10 },
    { me: "Pola dana (4 sata)", en: "Half day (4 hours)", minutes: 240, price: 30 },
    { me: "Cijeli dan (8 sati)", en: "Full day (8 hours)", minutes: 480, price: 50 },
  ],
  other: [{ me: "Termin", en: "Appointment", minutes: 30, price: null }],
};

/** Business types booked by resource (court, boat, bike) rather than by person. */
export const RESOURCE_TYPES: BusinessType[] = ["court", "rental"];

/** Starter resources for resource-based types, e.g. "Teren 1", "Teren 2". */
export function templateResources(type: BusinessType, locale: Locale): string[] {
  if (type === "court") return locale === "me" ? ["Teren 1", "Teren 2"] : ["Court 1", "Court 2"];
  if (type === "rental") return locale === "me" ? ["Br. 1", "Br. 2"] : ["No. 1", "No. 2"];
  return [];
}

export function templateServices(type: BusinessType, locale: Locale) {
  return SERVICE_TEMPLATES[type].map((s, i) => ({
    name: s[locale],
    durationMinutes: s.minutes,
    priceCents: s.price === null ? null : s.price * 100,
    sortOrder: i,
  }));
}

/** Default week: Mon–Fri 09:00–20:00, Sat 09:00–15:00 (clinics: Mon–Fri 08:00–16:00). */
export function defaultHours(type: BusinessType) {
  // Courts and rentals are open every day, courts into the evening
  if (type === "court") return Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, startMinute: 8 * 60, endMinute: 23 * 60 }));
  if (type === "rental") return Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, startMinute: 9 * 60, endMinute: 20 * 60 }));
  const medical = type === "dentist" || type === "clinic";
  const rows: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let weekday = 1; weekday <= 5; weekday++) {
    rows.push(medical ? { weekday, startMinute: 8 * 60, endMinute: 16 * 60 } : { weekday, startMinute: 9 * 60, endMinute: 20 * 60 });
  }
  if (!medical) rows.push({ weekday: 6, startMinute: 9 * 60, endMinute: 15 * 60 });
  return rows;
}
