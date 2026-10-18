import { Camera, MessageCircle } from "lucide-react";
import type { Dict } from "@/i18n/dict";
import { CONTACT, CONTACT_LINKS } from "@/lib/contact";

/** One quiet line: a question? Instagram or WhatsApp. */
export function ContactBlock({ t }: { t: Dict }) {
  return (
    <section id="kontakt" className="px-5 pb-12 scroll-mt-6">
      <div className="mx-auto max-w-3xl flex flex-wrap items-center justify-center gap-2 text-sm text-muted">
        <span>{t.home.contactTitle}</span>
        <a href={CONTACT_LINKS.instagram} target="_blank" rel="noreferrer" className="btn-ghost btn-sm text-ink">
          <Camera className="size-3.5" /> @{CONTACT.instagram}
        </a>
        <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer" className="btn-ghost btn-sm text-ink">
          <MessageCircle className="size-3.5" /> WhatsApp
        </a>
      </div>
    </section>
  );
}
