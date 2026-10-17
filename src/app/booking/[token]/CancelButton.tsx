"use client";

import { useTransition } from "react";
import { cancelBooking } from "@/app/actions";

export function CancelButton({ token, label, confirmText }: { token: string; label: string; confirmText: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn-ghost w-full text-danger hover:text-danger hover:bg-danger-soft"
      onClick={() => {
        if (confirm(confirmText)) start(() => cancelBooking(token));
      }}
    >
      {label}
    </button>
  );
}
