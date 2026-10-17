"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Native share sheet on phones; copies the link elsewhere. */
export function ShareButton({ label, copiedLabel, title }: { label: string; copiedLabel: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary btn-sm h-11 px-2"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Share sheet dismissed, or clipboard blocked: nothing to do
        }
      }}
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />} {copied ? copiedLabel : label}
    </button>
  );
}
