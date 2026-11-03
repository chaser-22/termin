// The privacy page text. Kept short and plain on purpose: what is stored, why,
// who sees it, how long, and how to have it changed or deleted.
// Before going live: put the operator's legal name and address in OPERATOR and
// have the text checked against Montenegro's Law on Personal Data Protection.
import type { Locale } from "@/i18n/dict";

export const UPDATED = "2026-11-03";

/** Who runs Termin. Fill in before going live. */
export const OPERATOR = { name: "Termin", address: "" };

type Section = { title: string; paragraphs?: string[]; items?: string[] };

export const PRIVACY: Record<Locale, { title: string; intro: string; updated: string; sections: Section[] }> = {
  me: {
    title: "Privatnost",
    intro: "Termin je servis za online zakazivanje termina. Ovdje kratko i jasno piše koje podatke čuvamo, zašto i kako ih možete obrisati.",
    updated: "Ažurirano",
    sections: [
      {
        title: "Ko je odgovoran za podatke",
        paragraphs: [
          "Kada zakažete termin, vaše podatke za taj termin dobija salon, ordinacija ili drugi posao kod kojeg zakazujete. On je odgovoran za njih, a Termin ih čuva i obrađuje u njegovo ime, samo za zakazivanje.",
          "Za podatke vlasnika posla (nalog na Termin-u) odgovoran je Termin.",
        ],
      },
      {
        title: "Koje podatke čuvamo",
        items: [
          "Klijenti: ime, broj telefona, email (ako ga upišete), napomenu uz termin i podatke o terminu (usluga, vrijeme, kod koga, status).",
          "Vlasnici posla: email adresu za prijavu i podatke o poslu koje sami unesu (naziv, adresa, usluge, radno vrijeme).",
          "U vašem pregledaču: izabrani jezik (kolačić), tema i vaše ime i telefon, samo na vašem uređaju, da sljedeći put ne kucate ponovo. Ne koristimo kolačiće za reklame ni praćenje.",
        ],
      },
      {
        title: "Zašto ih koristimo",
        items: [
          "da zakažemo vaš termin i prikažemo ga poslu kod kojeg zakazujete,",
          "da pošaljemo potvrdu i podsjetnik za termin (email ili SMS),",
          "da vlasnik posla može da vas kontaktira u vezi sa terminom.",
        ],
        paragraphs: ["Podatke ne prodajemo, ne koristimo ih za reklame i ne šaljemo vam marketinške poruke."],
      },
      {
        title: "Ko još ima pristup",
        paragraphs: [
          "Vaše podatke vidi samo posao kod kojeg ste zakazali. Za rad servisa koristimo provjerene pružaoce usluga: hosting, bazu podataka i slanje email i SMS poruka. Oni podatke obrađuju samo po našem nalogu i ne smiju ih koristiti za druge svrhe.",
        ],
      },
      {
        title: "Koliko dugo ih čuvamo",
        paragraphs: [
          "Podatke o terminima čuvamo dok posao koristi Termin, kako bi imao istoriju svojih termina. Kada posao zatvori nalog ili zatraži brisanje, brišemo njegove podatke i podatke njegovih klijenata.",
        ],
      },
      {
        title: "Vaša prava",
        paragraphs: [
          "Možete tražiti uvid u svoje podatke, ispravku, brisanje ili ograničenje obrade. Najbrže je da se javite poslu kod kojeg ste zakazali, ili nama na email ispod, pa ćemo zahtjev riješiti zajedno sa njim.",
          "Ako smatrate da se vašim podacima postupa nezakonito, možete podnijeti prigovor Agenciji za zaštitu ličnih podataka i slobodan pristup informacijama.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy",
    intro: "Termin is an online booking service. This page says briefly and plainly what we store, why, and how to have it deleted.",
    updated: "Updated",
    sections: [
      {
        title: "Who is responsible for your data",
        paragraphs: [
          "When you book, the details of that booking go to the salon, clinic or other business you book with. That business is responsible for them; Termin stores and processes them on its behalf, only for the booking.",
          "For business owners' data (their Termin account), Termin is responsible.",
        ],
      },
      {
        title: "What we store",
        items: [
          "Clients: name, phone number, email (if you enter one), a note with the booking, and booking details (service, time, with whom, status).",
          "Business owners: the email address used to sign in and the business details they enter (name, address, services, opening hours).",
          "In your browser: your chosen language (a cookie), the theme, and your name and phone on your device only, so you don't have to type them again. We use no advertising or tracking cookies.",
        ],
      },
      {
        title: "Why we use it",
        items: [
          "to make your booking and show it to the business you book with,",
          "to send a confirmation and a reminder of your appointment (email or SMS),",
          "so the business can contact you about the appointment.",
        ],
        paragraphs: ["We don't sell your data, use it for advertising, or send you marketing messages."],
      },
      {
        title: "Who else has access",
        paragraphs: [
          "Only the business you booked with sees your details. To run the service we use trusted providers for hosting, the database and sending email and SMS. They process data only on our instructions and may not use it for anything else.",
        ],
      },
      {
        title: "How long we keep it",
        paragraphs: [
          "We keep booking data while the business uses Termin, so it has a history of its appointments. When a business closes its account or asks for deletion, we delete its data and its clients' data.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "You can ask to see, correct or delete your data, or to limit how it is used. The quickest way is to contact the business you booked with, or us at the email below, and we will handle it together with them.",
          "If you believe your data is handled unlawfully, you can complain to Montenegro's Agency for Personal Data Protection and Free Access to Information.",
        ],
      },
    ],
  },
};
