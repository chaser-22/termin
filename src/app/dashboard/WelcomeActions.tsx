"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Camera, Check, Copy, MessageCircle, X } from "lucide-react";
import { CONTACT_LINKS } from "@/lib/contact";
import { markOnboarding, requestContinue } from "./actions";

/** The big "Copy booking link" button and the WhatsApp share next to it. */
export function ShareLink({ url, t }: { url: string; t: { copyLink: string; copied: string; shareWhatsapp: string; whatsappText: string } }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2.5">
      <button
        type="button"
        className="btn-primary w-full h-14 text-base"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
            markOnboarding("shared");
          } catch {}
        }}
      >
        {copied ? <Check className="size-5 animate-pop-in" /> : <Copy className="size-5" />} {copied ? t.copied : t.copyLink}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${t.whatsappText} ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        onClick={() => markOnboarding("shared")}
        className="btn-ghost w-full h-11"
      >
        <MessageCircle className="size-4" /> {t.shareWhatsapp}
      </a>
    </div>
  );
}

const HIDE_KEY = "termin:checklist-hidden";

/** Lets the owner tuck the checklist away; it is never required. */
export function ChecklistHide({ label, children }: { label: string; children: React.ReactNode }) {
  const stored = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(HIDE_KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const [hidden, setHidden] = useState(false);
  if (hidden || stored) return null;
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-muted hover:text-ink hover:bg-surface-2"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(HIDE_KEY, "1");
          } catch {}
        }}
      >
        <X className="size-4" />
      </button>
      {children}
    </div>
  );
}

/** Ticks "check your services" once the Services page has been opened. */
export function MarkServicesSeen() {
  useEffect(() => {
    markOnboarding("services");
  }, []);
  return null;
}

/** "Continue with Termin": records the request, then offers WhatsApp/Instagram to reach you. */
export function ContinueButton({ requested, message, t }: { requested: boolean; message: string; t: { continue: string; continueSent: string } }) {
  const [sent, setSent] = useState(requested);
  if (sent) {
    return (
      <div className="space-y-3 animate-pop-in">
        <p className="font-medium">{t.continueSent}</p>
        <div className="flex gap-2">
          <a href={`${CONTACT_LINKS.whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="btn-primary flex-1">
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <a href={CONTACT_LINKS.instagram} target="_blank" rel="noreferrer" className="btn-secondary flex-1">
            <Camera className="size-4" /> Instagram
          </a>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="btn-primary w-full h-12"
      onClick={() => {
        setSent(true);
        requestContinue();
      }}
    >
      {t.continue}
    </button>
  );
}
