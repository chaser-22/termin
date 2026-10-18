// One landing page per kind of business (/za/<slug>). Everything a dentist sees
// is about dentists; everything a court owner sees is about courts.
import type { Locale } from "@/i18n/dict";
import type { BusinessType } from "@/lib/slug";

type Text = Record<Locale, string>;
type Pair = { title: Text; body: Text };

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
  icon: "scissors" | "tooth" | "flower" | "dumbbell" | "trophy" | "bike";
  setupType: BusinessType;
  demo: string;
  tile: { title: Text; line: Text };
  headline: Text;
  sub: Text;
  pains: Pair[];
  mock: MockData;
};

export const VERTICALS: Vertical[] = [
  {
    slug: "berbernice",
    icon: "scissors",
    setupType: "barber",
    demo: "/marko",
    tile: {
      title: { me: "Berbernice", en: "Barbers" },
      line: { me: "Frizeri, nokti, kozmetika", en: "Hair, nails, beauty" },
    },
    headline: { me: "Online zakazivanje za vašu berbernicu ili salon.", en: "Online booking for your barbershop or salon." },
    sub: {
      me: "Klijenti biraju uslugu, frizera i termin sa Instagrama, 0–24. Vi radite, telefon ćuti.",
      en: "Clients pick the service, the barber and a time from Instagram, 24/7. You work; the phone stays quiet.",
    },
    pains: [
      {
        title: { me: "Telefon zvoni dok radite", en: "The phone rings while you work" },
        body: { me: "Klijenti zakazuju sami, sa linka u Instagram biografiji ili QR koda na vratima.", en: "Clients book themselves from the link in your Instagram bio or the QR code on the door." },
      },
      {
        title: { me: "Klijenti koji ne dođu", en: "Clients who don't show up" },
        body: { me: "Termin ide u njihov kalendar sa podsjetnikom, a vi vidite ko često izostaje.", en: "The booking goes into their calendar with a reminder, and you see who often misses." },
      },
      {
        title: { me: "Prazne rupe u danu", en: "Empty gaps in the day" },
        body: { me: "Slobodni termini su vidljivi odmah, pa ih klijenti popune sami.", en: "Free times are visible right away, so clients fill them on their own." },
      },
    ],
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
    slug: "stomatolozi",
    icon: "tooth",
    setupType: "dentist",
    demo: "/demo-stomatolog",
    tile: {
      title: { me: "Stomatolozi", en: "Dentists" },
      line: { me: "Pregledi, kontrole, terapije", en: "Check-ups, follow-ups, treatments" },
    },
    headline: { me: "Online zakazivanje pregleda za vašu ordinaciju.", en: "Online appointment booking for your practice." },
    sub: {
      me: "Pacijenti zakazuju sami, bez poziva usred intervencije. Svaki doktor ima svoj uredan raspored.",
      en: "Patients book themselves, with no calls in the middle of a procedure. Every doctor has a tidy schedule.",
    },
    pains: [
      {
        title: { me: "Pozivi tokom intervencije", en: "Calls during a procedure" },
        body: { me: "Pacijent zakaže online, a vi i sestra ne prekidate rad.", en: "Patients book online, so you and your nurse don't have to stop working." },
      },
      {
        title: { me: "Pacijenti zaborave termin", en: "Patients forget appointments" },
        body: { me: "Pregled ide u kalendar telefona, sa podsjetnikom dva sata ranije.", en: "The appointment goes into their phone calendar, with a reminder two hours before." },
      },
      {
        title: { me: "Privatnost pacijenata", en: "Patient privacy" },
        body: { me: "Čuvamo samo ime i telefon. Pacijent ne pravi nalog i ne preuzima aplikaciju.", en: "We keep only a name and phone number. Patients make no account and download no app." },
      },
    ],
    mock: {
      initial: "S",
      typeLabel: { me: "Stomatolog · Kotor", en: "Dentist · Kotor" },
      name: "Stomatologija Kotor",
      mode: "person",
      items: [
        { name: { me: "Pregled", en: "Check-up" }, meta: "30 min", price: "20 €" },
        { name: { me: "Uklanjanje kamenca", en: "Scale and polish" }, meta: "45 min", price: "40 €" },
        { name: { me: "Plomba", en: "Filling" }, meta: "1 h", price: "—" },
        { name: { me: "Izbjeljivanje zuba", en: "Teeth whitening" }, meta: "1 h", price: "150 €" },
      ],
      pill: { day: { me: "Sjutra · Pregled", en: "Tomorrow · Check-up" }, time: "09:30" },
    },
  },
  {
    slug: "masaza",
    icon: "flower",
    setupType: "massage",
    demo: "/demo-masaza",
    tile: {
      title: { me: "Masaža", en: "Massage" },
      line: { me: "Tretmani, spa, saune", en: "Treatments, spa, saunas" },
    },
    headline: { me: "Online zakazivanje za masažu i wellness.", en: "Online booking for massage and wellness." },
    sub: {
      me: "Gosti biraju tretman i termin, na crnogorskom ili engleskom. Sobe i terapeuti nikad nisu duplo zauzeti.",
      en: "Guests choose a treatment and a time, in Montenegrin or English. Rooms and therapists are never double-booked.",
    },
    pains: [
      {
        title: { me: "Poruke na više jezika", en: "Messages in several languages" },
        body: { me: "Stranica radi na engleskom i crnogorskom, pa gost zakaže sam.", en: "Your page works in English and Montenegrin, so guests book on their own." },
      },
      {
        title: { me: "Duplo zauzeta soba", en: "A room booked twice" },
        body: { me: "Svaka soba i svaki terapeut imaju svoj kalendar.", en: "Every room and every therapist has their own calendar." },
      },
      {
        title: { me: "Gosti hotela i turisti", en: "Hotel guests and tourists" },
        body: { me: "Link ili QR kod na recepciji, a zakazivanje traje minut.", en: "A link or QR code at reception, and booking takes a minute." },
      },
    ],
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
    tile: {
      title: { me: "Fitness", en: "Fitness" },
      line: { me: "Grupni časovi, treninzi", en: "Group classes, training" },
    },
    headline: { me: "Online prijave za vaše časove i treninge.", en: "Online sign-ups for your classes and training." },
    sub: {
      me: "Članovi vide raspored i koliko je mjesta ostalo, i prijave se jednim dodirom.",
      en: "Members see the schedule and how many places are left, and sign up in one tap.",
    },
    pains: [
      {
        title: { me: "Prijave preko Vibera", en: "Sign-ups over Viber" },
        body: { me: "Svako se prijavi sam, a vi vidite spisak za svaki čas.", en: "Everyone signs up themselves, and you see the list for every class." },
      },
      {
        title: { me: "Prepun čas", en: "An overfull class" },
        body: { me: "Kad je čas pun, prijave se zatvaraju same.", en: "When a class is full, sign-ups close on their own." },
      },
      {
        title: { me: "Personalni treninzi", en: "Personal training" },
        body: { me: "Individualni termini su u istom kalendaru kao i časovi.", en: "One-to-one sessions sit in the same calendar as your classes." },
      },
    ],
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
    tile: {
      title: { me: "Tereni", en: "Courts" },
      line: { me: "Padel, tenis, fudbal", en: "Padel, tennis, football" },
    },
    headline: { me: "Online rezervacija terena, 0–24.", en: "Online court booking, 24/7." },
    sub: {
      me: "Igrači vide slobodne termine i rezervišu teren sami. Bez poziva u 23h.",
      en: "Players see the free times and book a court themselves. No calls at 11 pm.",
    },
    pains: [
      {
        title: { me: "Pozivi do kasno u noć", en: "Calls late into the night" },
        body: { me: "Igrači rezervišu sami, kad god im odgovara.", en: "Players book on their own, whenever suits them." },
      },
      {
        title: { me: "Duple rezervacije", en: "Double bookings" },
        body: { me: "Svaki teren ima svoj raspored, pa preklapanja nisu moguća.", en: "Every court has its own schedule, so overlaps can't happen." },
      },
      {
        title: { me: "Prazni termini", en: "Empty slots" },
        body: { me: "Slobodni termini se vide odmah, pa se lakše popune.", en: "Free times are visible right away, so they fill up more easily." },
      },
    ],
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
    tile: {
      title: { me: "Iznajmljivanje", en: "Rentals" },
      line: { me: "Bicikli, kajaci, čamci", en: "Bikes, kayaks, boats" },
    },
    headline: { me: "Online rezervacije za bicikle, kajake i čamce.", en: "Online bookings for bikes, kayaks and boats." },
    sub: {
      me: "Turisti rezervišu na sat ili cijeli dan, na engleskom, i dođu po opremu u dogovoreno vrijeme.",
      en: "Tourists book by the hour or the day, in English, and come for the gear at the agreed time.",
    },
    pains: [
      {
        title: { me: "Turisti pišu na engleskom", en: "Tourists write in English" },
        body: { me: "Stranica je na engleskom i crnogorskom, pa nema prepiske.", en: "Your page is in English and Montenegrin, so there's no back-and-forth." },
      },
      {
        title: { me: "Ko ima koji bicikl", en: "Who has which bike" },
        body: { me: "Svaka stvar ima svoj kalendar, bez zabune.", en: "Every item has its own calendar, with no mix-ups." },
      },
      {
        title: { me: "Sezona je kratka", en: "The season is short" },
        body: { me: "Rezervacije stižu 0–24, i dok ste na vodi.", en: "Bookings come in 24/7, even while you're out on the water." },
      },
    ],
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
