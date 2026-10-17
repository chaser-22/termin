"use client";

import { useTransition } from "react";
import type { BookingStatus } from "@/db/schema";
import { setBookingStatus } from "./actions";

type Labels = { completed: string; noShow: string; cancel: string; restore: string };

export function BookingActions({ id, status, labels }: { id: string; status: BookingStatus; labels: Labels }) {
  const [pending, start] = useTransition();
  const set = (s: BookingStatus) => start(() => setBookingStatus(id, s));
  if (status !== "confirmed") {
    return (
      <button className="btn-secondary btn-sm w-full" disabled={pending} onClick={() => set("confirmed")}>
        {labels.restore}
      </button>
    );
  }
  return (
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
  );
}
