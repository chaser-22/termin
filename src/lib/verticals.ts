// One landing page per kind of business (/za/<slug>). Everything a dentist sees
// is about dentists; everything a court owner sees is about courts.
import type { Locale } from "@/i18n/dict";
import type { BusinessType } from "@/lib/slug";
import type { BrandKey } from "@/lib/brand";

type Text = Record<Locale, string>;

/** What the phone preview on the page shows */
export type MockData = {
  initial: string;
  typeLabel: Text;
  name: string;
  mode: "person" | "place" | "class";
  /** Service tiles (person/place) or classes (class) */
  items: { name: Text; meta: string; price?: string; left?: number }[];
  pill: { day: Text; time: string };
};

export type Vertical = {
  slug: string;
  icon: "scissors" | "tooth" | "sparkles" | "flower" | "dumbbell" | "trophy" | "bike";
  setupType: BusinessType;
  demo: string;
  /** A restrained accent for the page (a key from src/lib/brand.ts) */
  accent: BrandKey;
  tile: { title: Text; line: Text };
  headline: Text;
  sub: Text;
  mock: MockData;
};

export const VERTICALS: Vertical[] = [
  {
    slug: "stomatolozi",
    icon: "tooth",
    setupType: "dentist",
    demo: "/demo-stomatolog",
    accent: "cobalt",
    tile: {
      title: { me: "Stomatološke ordinacije", en: "Dental clinics" },
      line: { me: "Pregledi, kamenac, konsultacije", en: "Check-ups, cleanings, consultations" },
    },
    headline: { me: "Više vremena za pacijente. Manje poziva za zakazivanje.", en: "More time with patients. Less time answering calls." },
    sub: {
      me: "Pacijenti online zakazuju pregled, čišćenje kamenca ili konsultacije. Vi sve vidite u jednom jednostavnom kalendaru.",
      en: "Your patients book examinations, cleanings and consultations online. You manage appointments in one simple calendar.",
    },
    mock: {
      initial: "S",
      typeLabel: { me: "Stomatolog · Kotor", en: "Dentist · Kotor" },
      name: "Stomatologija Kotor",
      mode: "person",
      items: [
        { name: { me: "Stomatološki pregled", en: "Dental examination" }, meta: "30 min", price: "20 €" },
        { name: { me: "Čišćenje kamenca", en: "Scale and polish" }, meta: "45 min", price: "40 €" },
        { name: { me: "Konsultacije", en: "Consultation" }, meta: "30 min", price: "—" },
        { name: { me: "Kontrolni pregled", en: "Follow-up check" }, meta: "20 min", price: "—" },
      ],
      pill: { day: { me: "Sjutra · Stomatološki pregled", en: "Tomorrow · Dental examination" }, time: "09:30" },
    },
  },
  {
    slug: "nokti",
    icon: "sparkles",
    setupType: "nails",
    demo: "/demo-nokti",
    accent: "bordeaux",
    tile: {
      title: { me: "Studiji za nokte", en: "Nail studios" },
      line: { me: "Manikir, gel lak, nadogradnja", en: "Manicure, gel polish, extensions" },
    },
    headline: { me: "Savršeni nokti. Zakazivanje bez muke.", en: "Beautiful nails. Effortless bookings." },
    sub: {
      me: "Klijentkinje online biraju tretman i termin. Manje poruka na Instagramu, više vremena za rad.",
      en: "Clients choose their treatment and time online. Fewer Instagram messages, more time for your work.",
    },
    mock: {
      initial: "L",
      typeLabel: { me: "Studio za nokte · Podgorica", en: "Nail studio · Podgorica" },
      name: "Nail Studio Lena",
      mode: "person",
      items: [
        { name: { me: "Gel lak", en: "Gel polish" }, meta: "1 h", price: "20 €" },
        { name: { me: "Klasični manikir", en: "Classic manicure" }, meta: "45 min", price: "15 €" },
        { name: { me: "Nadogradnja noktiju", en: "Nail extensions" }, meta: "1 h 30 min", price: "35 €" },
        { name: { me: "Korekcija noktiju", en: "Nail infill" }, meta: "1 h", price: "25 €" },
      ],
      pill: { day: { me: "Sjutra · Gel lak", en: "Tomorrow · Gel polish" }, time: "11:00" },
    },
  },
  {
    slug: "berbernice",
    icon: "scissors",
    setupType: "barber",
    demo: "/marko",
    accent: "noir",
    tile: {
      title: { me: "Berbernice i saloni", en: "Barbers & hair salons" },
      line: { me: "Šišanje, brada, frizure", en: "Haircuts, beards, styling" },
    },
    headline: { me: "Više šišanja. Manje poruka oko termina.", en: "More haircuts. Fewer scheduling messages." },
    sub: {
      me: "Klijenti online biraju berberina i slobodan termin, bez poziva i poruka.",
      en: "Customers choose their barber and a free time online, without calling or messaging."
    },
    mock: {
      initial: "B",
      typeLabel: { me: "Berbernica · Podgorica", en: "Barber · Podgorica" },
      name: "Berbernica Marko",
      mode: "person",
      items: [
        { name: { me: "Muško šišanje", en: "Men's haircut" }, meta: "30 min", price: "10 €" },
        { name: { me: "Šišanje i brada", en: "Haircut and beard" }, meta: "45 min", price: "15 €" },
        { name: { me: "Uređivanje brade", en: "Beard trim" }, meta: "15 min", price: "5 €" },
        { name: { me: "Dječije šišanje", en: "Kids' haircut" }, meta: "20 min", price: "7 €" },
      ],
      pill: { day: { me: "Danas · Muško šišanje", en: "Today · Men's haircut" }, time: "14:00" },
    },
  },
  {
    slug: "masaza",
    icon: "flower",
    setupType: "massage",
    demo: "/demo-masaza",
    accent: "olive",
    tile: {
      title: { me: "Masaža i wellness", en: "Massage & wellness" },
      line: { me: "Masaže, tretmani, spa", en: "Massages, treatments, spa" },
    },
    headline: { me: "Gosti zakazuju sami. Vi ostajete u miru.", en: "Guests book themselves. You stay calm." },
    sub: {
      me: "Gosti biraju tretman i termin, na crnogorskom ili engleskom. Sobe i terapeuti nikad nisu duplo zauzeti.",
      en: "Guests choose a treatment and a time, in Montenegrin or English. Rooms and therapists are never double-booked.",
    },
    mock: {
      initial: "W",
      typeLabel: { me: "Masaža · Budva", en: "Massage · Budva" },
      name: "Wellness Budva",
      mode: "person",
      items: [
        { name: { me: "Relaks masaža 60 min", en: "Relaxing massage 60 min" }, meta: "1 h", price: "35 €" },
        { name: { me: "Sportska masaža", en: "Sports massage" }, meta: "1 h", price: "40 €" },
        { name: { me: "Relaks masaža 30 min", en: "Relaxing massage 30 min" }, meta: "30 min", price: "20 €" },
        { name: { me: "Masaža za parove", en: "Couples massage" }, meta: "1 h", price: "70 €" },
      ],
      pill: { day: { me: "Danas · Relaks masaža", en: "Today · Relaxing massage" }, time: "17:00" },
    },
  },
  {
    slug: "fitness",
    icon: "dumbbell",
    setupType: "fitness",
    demo: "/demo-joga",
    accent: "gold",
    tile: {
      title: { me: "Fitness i joga", en: "Fitness & yoga" },
      line: { me: "Grupni časovi, treninzi", en: "Group classes, training" },
    },
    headline: { me: "Pun čas. Bez prijava preko Vibera.", en: "Full classes. No sign-ups over Viber." },
    sub: {
      me: "Članovi vide raspored i koliko je mjesta ostalo, i prijave se jednim dodirom.",
      en: "Members see the schedule and how many places are left, and sign up in one tap.",
    },
    mock: {
      initial: "J",
      typeLabel: { me: "Fitness i joga · Kotor", en: "Fitness & yoga · Kotor" },
      name: "Joga Kotor",
      mode: "class",
      items: [
        { name: { me: "Joga", en: "Yoga" }, meta: "18:00", left: 3 },
        { name: { me: "Pilates", en: "Pilates" }, meta: "19:00", left: 1 },
        { name: { me: "Funkcionalni trening", en: "Functional training" }, meta: "07:30", left: 9 },
      ],
      pill: { day: { me: "Sjutra · Joga", en: "Tomorrow · Yoga" }, time: "18:00" },
    },
  },
  {
    slug: "tereni",
    icon: "trophy",
    setupType: "court",
    demo: "/demo-padel",
    accent: "cobalt",
    tile: {
      title: { me: "Sportski tereni", en: "Sports courts" },
      line: { me: "Padel, tenis, fudbal", en: "Padel, tennis, football" },
    },
    headline: { me: "Tereni se rezervišu sami, 0–24.", en: "Courts that book themselves, 24/7." },
    sub: {
      me: "Igrači vide slobodne termine i rezervišu teren sami. Bez poziva u 23h.",
      en: "Players see the free times and book a court themselves. No calls at 11 pm.",
    },
    mock: {
      initial: "P",
      typeLabel: { me: "Tereni · Budva", en: "Courts · Budva" },
      name: "Padel Budva",
      mode: "place",
      items: [
        { name: { me: "Teren 60 min", en: "Court 60 min" }, meta: "1 h", price: "20 €" },
        { name: { me: "Teren 90 min", en: "Court 90 min" }, meta: "1 h 30 min", price: "28 €" },
      ],
      pill: { day: { me: "Danas · Teren 90 min", en: "Today · Court 90 min" }, time: "19:30" },
    },
  },
  {
    slug: "iznajmljivanje",
    icon: "bike",
    setupType: "rental",
    demo: "/demo-rent",
    accent: "adriatic",
    tile: {
      title: { me: "Iznajmljivanje opreme", en: "Equipment rentals" },
      line: { me: "Bicikli, kajaci, čamci", en: "Bikes, kayaks, boats" },
    },
    headline: { me: "Rezervacije stižu i dok ste na vodi.", en: "Bookings arrive even while you're on the water." },
    sub: {
      me: "Turisti rezervišu na sat ili cijeli dan, na engleskom, i dođu po opremu u dogovoreno vrijeme.",
      en: "Tourists book by the hour or the day, in English, and come for the gear at the agreed time.",
    },
    mock: {
      initial: "T",
      typeLabel: { me: "Iznajmljivanje · Tivat", en: "Rentals · Tivat" },
      name: "Bike & Kayak Tivat",
      mode: "place",
      items: [
        { name: { me: "Iznajmljivanje 1 sat", en: "Rental 1 hour" }, meta: "1 h", price: "10 €" },
        { name: { me: "Cijeli dan (8 sati)", en: "Full day (8 hours)" }, meta: "8 h", price: "50 €" },
      ],
      pill: { day: { me: "Danas · Iznajmljivanje 1 sat", en: "Today · Rental 1 hour" }, time: "10:00" },
    },
  },
];

export function verticalBySlug(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}

// Business types without a page of their own borrow the closest one's demo
const DEMO_FALLBACK: Partial<Record<BusinessType, string>> = { salon: "barber", beauty: "nails", clinic: "dentist", other: "barber" };

/** The demo business slug to preview for a business type. */
export function demoSlugFor(type: BusinessType): string {
  const v = VERTICALS.find((x) => x.setupType === type) ?? VERTICALS.find((x) => x.setupType === DEMO_FALLBACK[type]) ?? VERTICALS[0];
  return v.demo.slice(1);
}
