// The end of the homepage: how to start, common questions, one last nudge.
// Every answer describes what the app really does today.
import type { Locale } from "@/i18n/dict";

type Copy = {
  steps: [string, string];
  faqTitle: string;
  /** privacy: the answer ends with a link to the privacy page */
  faq: { q: string; a: string; privacy?: boolean }[];
  privacyMore: string;
  setUpForYou: string;
  /** Section names in the desktop header */
  navIndustries: string;
  navFeatures: string;
  navSteps: string;
  navQuestions: string;
};

export const HOME_MORE: Record<Locale, Copy> = {
  me: {
    steps: ["Upišite usluge i radno vrijeme", "Podijelite svoj link"],
    faqTitle: "Česta pitanja",
    faq: [
      {
        q: "Da li klijenti moraju instalirati aplikaciju?",
        a: "Ne. Otvore vaš link u telefonu, izaberu uslugu i termin i upišu ime i broj telefona. Bez aplikacije i bez naloga.",
      },
      {
        q: "Koliko košta?",
        a: "Prva 3 dana su besplatna i ne treba vam kartica. Ne uzimamo proviziju od termina. Za cijenu nakon probnog perioda pišite nam na Instagramu ili WhatsAppu.",
      },
      {
        q: "Mogu li i dalje zakazivati telefonom?",
        a: "Naravno. Termine dogovorene telefonom upišete u isti kalendar, pa niko ne može online zakazati u isto vrijeme.",
      },
      {
        q: "Šta ako klijent zaboravi ili ne može doći?",
        a: "Dan ranije dobije podsjetnik emailom ili SMS-om. Ako ne može doći, otkaže preko svog linka i termin se odmah oslobodi za nekog drugog.",
      },
      {
        q: "Ko sve podešava?",
        a: "Vi, za par minuta: usluge i radno vrijeme su već predloženi za vašu djelatnost. Ako vam je lakše, pišite nam i podesimo sve za vas.",
      },
      {
        q: "Šta se dešava sa podacima klijenata?",
        a: "Čuvamo samo ono što treba za termin: ime, telefon i email ako ga klijent upiše. Vidite ih samo vi.",
        privacy: true,
      },
    ],
    privacyMore: "Više u politici privatnosti",
    setUpForYou: "Ili nam pišite i podesimo sve za vas",
    navIndustries: "Djelatnosti",
    navFeatures: "Šta dobijate",
    navSteps: "Kako počinjete",
    navQuestions: "Pitanja",
  },
  en: {
    steps: ["Add your services and hours", "Share your link"],
    faqTitle: "Common questions",
    faq: [
      {
        q: "Do clients have to install an app?",
        a: "No. They open your link on their phone, pick a service and a time, and enter their name and phone number. No app, no account.",
      },
      {
        q: "How much does it cost?",
        a: "The first 3 days are free and you don't need a card. We take no commission on bookings. For the price after the trial, message us on Instagram or WhatsApp.",
      },
      {
        q: "Can I still take bookings by phone?",
        a: "Of course. Add phone bookings to the same calendar, so nobody can book that time online.",
      },
      {
        q: "What if a client forgets or can't come?",
        a: "They get a reminder by email or SMS the day before. If they can't come, they cancel from their link and the slot frees up for someone else right away.",
      },
      {
        q: "Who sets everything up?",
        a: "You, in a few minutes: services and hours are already suggested for your kind of business. If you'd rather not, message us and we'll set it all up for you.",
      },
      {
        q: "What happens to my clients' details?",
        a: "We keep only what a booking needs: name, phone, and email if the client enters one. Only you see them.",
        privacy: true,
      },
    ],
    privacyMore: "More in the privacy policy",
    setUpForYou: "Or message us and we'll set it all up for you",
    navIndustries: "Industries",
    navFeatures: "What you get",
    navSteps: "Getting started",
    navQuestions: "Questions",
  },
};
