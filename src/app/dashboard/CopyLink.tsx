"use client";

import { useState } from "react";

export function CopyLink({ url, copyLabel, copiedLabel }: { url: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <a href={url} target="_blank" rel="noreferrer" className="input flex items-center truncate text-sm text-accent font-medium">
        {url.replace(/^https?:\/\//, "")}
      </a>
      <button
        type="button"
        className="btn-secondary shrink-0"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
