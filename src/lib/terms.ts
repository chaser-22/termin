// The words each kind of business uses: a dentist has a doctor and patients,
// a barber has barbers and clients. Used on landing pages and booking pages.
import type { Locale } from "@/i18n/dict";
import type { BusinessType } from "@/lib/slug";

type Text = Record<Locale, string>;

export type Terms = {
  /** Booking step "who will do it", for people (resources keep the shared wording) */
  whoQuestion: Text;
  anyone: Text;
  /** "Share your link with …" */
  withAudience: Text;
  /** First of the three "how it works" steps */
  setUp: Text;
  /** "Try it … " */
  asClient: Text;
  /** "… can now book using your link" */
  who: Text;
};

const DEFAULT: Terms = {
  whoQuestion: { me: "Kod koga?", en: "With whom?" },
  anyone: { me: "Bilo ko slobodan", en: "Anyone available" },
  withAudience: { me: "sa klijentima", en: "with your clients" },
  setUp: { me: "Podesite svoj posao", en: "Set up your business" },
  asClient: { me: "kao klijent", en: "as a client" },
  who: { me: "Klijenti", en: "Customers" },
};

const TERMS: Partial<Record<BusinessType, Partial<Terms>>> = {
  dentist: {
    whoQuestion: { me: "Kod kog doktora?", en: "Which doctor?" },
    anyone: { me: "Bilo koji slobodan doktor", en: "Any available doctor" },
    withAudience: { me: "sa pacijentima", en: "with your patients" },
    setUp: { me: "Podesite svoju ordinaciju", en: "Set up your clinic" },
    asClient: { me: "kao pacijent", en: "as a patient" },
    who: { me: "Pacijenti", en: "Patients" },
  },
  clinic: {
    whoQuestion: { me: "Kod kog doktora?", en: "Which doctor?" },
    anyone: { me: "Bilo koji slobodan doktor", en: "Any available doctor" },
    withAudience: { me: "sa pacijentima", en: "with your patients" },
    setUp: { me: "Podesite svoju ordinaciju", en: "Set up your clinic" },
    asClient: { me: "kao pacijent", en: "as a patient" },
    who: { me: "Pacijenti", en: "Patients" },
  },
  barber: {
    whoQuestion: { me: "Kod kog berberina?", en: "Which barber?" },
    setUp: { me: "Podesite svoju berbernicu", en: "Set up your barbershop" },
  },
  salon: { setUp: { me: "Podesite svoj salon", en: "Set up your salon" } },
  nails: { setUp: { me: "Podesite svoj studio", en: "Set up your studio" } },
  beauty: { setUp: { me: "Podesite svoj salon", en: "Set up your salon" } },
  massage: {
    whoQuestion: { me: "Kod kog terapeuta?", en: "Which therapist?" },
    withAudience: { me: "sa gostima", en: "with your guests" },
    setUp: { me: "Podesite svoj wellness", en: "Set up your spa" },
    asClient: { me: "kao gost", en: "as a guest" },
    who: { me: "Gosti", en: "Guests" },
  },
  fitness: {
    whoQuestion: { me: "Kod kog trenera?", en: "Which trainer?" },
    withAudience: { me: "sa članovima", en: "with your members" },
    setUp: { me: "Podesite svoj studio", en: "Set up your studio" },
    asClient: { me: "kao član", en: "as a member" },
    who: { me: "Članovi", en: "Members" },
  },
  court: { withAudience: { me: "sa igračima", en: "with your players" }, setUp: { me: "Podesite svoje terene", en: "Set up your courts" }, asClient: { me: "kao igrač", en: "as a player" }, who: { me: "Igrači", en: "Players" } },
  rental: { withAudience: { me: "sa gostima", en: "with your customers" }, setUp: { me: "Podesite svoju ponudu", en: "Set up your rentals" }, asClient: { me: "kao gost", en: "as a guest" }, who: { me: "Gosti", en: "Guests" } },
};

export function termsFor(type: BusinessType): Terms {
  return { ...DEFAULT, ...TERMS[type] };
}
