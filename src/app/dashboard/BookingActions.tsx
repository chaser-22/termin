"use client";

import { useState, useTransition } from "react";
import type { BookingStatus } from "@/db/schema";
import { setBookingStatus } from "./actions";

type Labels = { completed: string; noShow: string; cancel: string; restore: string; restoreConflict: string; error: string };

export function BookingActions({ id, status, labels }: { id: string; status: BookingStatus; labels: Labels }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const set = (s: BookingStatus) =>
    start(async () => {
      const res = await setBookingStatus(id, s);
      setError(res?.error === "restoreConflict" ? labels.restoreConflict : res?.error ? labels.error : null);
    });

  return (
    <div className="space-y-2">
      {status !== "confirmed" ? (
        <button className="btn-secondary btn-sm w-full" disabled={pending} onClick={() => set("confirmed")}>
          {labels.restore}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button className="btn-secondary btn-sm text-ok" disabled={pending} onClick={() => set("completed")}>
            {labels.completed}
          </button>
          <button className="btn-secondary btn-sm" disabled={pending} onClick={() => set("no_show")}>
            {labels.noShow}
          </button>
          <button className="btn-secondary btn-sm text-danger" disabled={pending} onClick={() => set("cancelled")}>
            {labels.cancel}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
