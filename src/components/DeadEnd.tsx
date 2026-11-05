import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** A page that can't be shown: says why and always offers a way back. */
export function DeadEnd({ message, home }: { message: string; home: string }) {
  return (
    <div className="card mx-auto max-w-sm p-8 text-center">
      <p className="text-muted">{message}</p>
      <Link href="/" className="btn-secondary btn-sm mt-5">
        <ArrowLeft className="size-4" /> {home}
      </Link>
    </div>
  );
}
