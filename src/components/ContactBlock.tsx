import { MessageCircle, Phone } from "lucide-react";
import type { Dict } from "@/i18n/dict";
import { CONTACT, CONTACT_LINKS } from "@/lib/contact";
import type { BusinessType } from "@/lib/slug";
import { StartLink } from "@/app/StartLink";

/** "We'll come and set it up" with phone, Viber and WhatsApp, plus a self-serve start. */
export function ContactBlock({ t, setupType }: { t: Dict; setupType?: BusinessType }) {
  const h = t.home;
  return (
    <section id="kontakt" className="px-4 pb-16 scroll-mt-6">
      <div className="relative mx-auto max-w-3xl overflow-hidden text-center rounded-[36px] bg-[var(--pill-bg)] text-[var(--pill-fg)] backdrop-blur-2xl px-6 py-14 sm:px-12 sm:py-16">
        <div aria-hidden className="absolute -right-24 -bottom-32 size-[420px] max-w-[100vw] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
        <div className="relative mx-auto max-w-xl">
          <h2 className="display text-[30px] sm:text-[44px]">{h.contactTitle}</h2>
          <p className="mt-3 text-lg opacity-80">{h.contactBody}</p>
          <p className="mt-6 display text-[26px] tabular-nums select-all">{CONTACT.phone}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <a href={CONTACT_LINKS.call} className="btn h-12 px-5 bg-[var(--pill-fg)] text-[var(--pill-bg)] hover:opacity-90">
              <Phone className="size-4" /> {h.call}
            </a>
            <a href={CONTACT_LINKS.viber} className="btn h-12 px-5 border border-[color-mix(in_srgb,var(--pill-fg)_25%,transparent)] hover:bg-[color-mix(in_srgb,var(--pill-fg)_10%,transparent)]">
              <MessageCircle className="size-4" /> Viber
            </a>
            <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer" className="btn h-12 px-5 border border-[color-mix(in_srgb,var(--pill-fg)_25%,transparent)] hover:bg-[color-mix(in_srgb,var(--pill-fg)_10%,transparent)]">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>
          {setupType && (
            <StartLink type={setupType} className="mt-6 inline-block text-sm underline underline-offset-4 opacity-80 hover:opacity-100">
              {h.startSelf} →
            </StartLink>
          )}
        </div>
      </div>
    </section>
  );
}
