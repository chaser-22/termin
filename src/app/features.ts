// "What else you get" on the homepage: only things the app really does today.
import type { Locale } from "@/i18n/dict";

export type FeatureKind = "reminder" | "cancel" | "phone" | "staff" | "qr" | "languages";

type Copy = {
  title: string;
  items: { kind: FeatureKind; title: string; body: string }[];
  /** Words inside the small animations */
  mini: { reminder: string; tomorrow: string; cancel: string; free: string; byPhone: string; online: string; book: string };
};

export const FEATURES: Record<Locale, Copy> = {
  me: {
    title: "Šta još dobijate",
    items: [
      { kind: "reminder", title: "Podsjetnik dan ranije", body: "Klijent dobije podsjetnik emailom ili SMS-om. Manje propuštenih termina." },
      { kind: "cancel", title: "Otkazivanje bez poziva", body: "Klijent otkaže preko svog linka, a termin se odmah oslobodi." },
      { kind: "phone", title: "Termini preko telefona", body: "Ono što dogovorite telefonom upišete u isti kalendar." },
      { kind: "staff", title: "Raspored za svakog zaposlenog", body: "Svako ima svoje radno vrijeme i pauze." },
      { kind: "qr", title: "QR kod i link", body: "QR kod za vrata i link za Instagram biografiju." },
      { kind: "languages", title: "Crnogorski i engleski", body: "Stranica radi na oba jezika, za domaće i turiste." },
    ],
    mini: { reminder: "Podsjetnik", tomorrow: "sjutra", cancel: "Otkaži", free: "Slobodno", byPhone: "telefonom", online: "online", book: "Zakaži termin" },
  },
  en: {
    title: "What else you get",
    items: [
      { kind: "reminder", title: "A reminder the day before", body: "Clients get a reminder by email or SMS. Fewer missed appointments." },
      { kind: "cancel", title: "Cancelling without a call", body: "Clients cancel from their link and the slot frees up right away." },
      { kind: "phone", title: "Phone bookings too", body: "Add what you arrange by phone to the same calendar." },
      { kind: "staff", title: "A schedule for everyone", body: "Each person has their own hours and breaks." },
      { kind: "qr", title: "QR code and link", body: "A QR code for the door and a link for your Instagram bio." },
      { kind: "languages", title: "Montenegrin and English", body: "Your page works in both, for locals and tourists." },
    ],
    mini: { reminder: "Reminder", tomorrow: "tomorrow", cancel: "Cancel", free: "Free", byPhone: "by phone", online: "online", book: "Book now" },
  },
};
