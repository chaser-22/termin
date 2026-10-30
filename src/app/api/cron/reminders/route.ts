import { timingSafeEqual } from "node:crypto";
import { sendDueReminders } from "@/lib/server/notify";
import { appOrigin } from "@/lib/server/url";

function authorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  // Without a secret, only in development (so you can open it in the browser)
  if (!secret) return process.env.NODE_ENV !== "production";
  const want = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(header ?? "");
  return got.length === want.length && timingSafeEqual(got, want);
}

// GET /api/cron/reminders → { sent: n }
// Vercel Cron calls this (see vercel.json) with "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const sent = await sendDueReminders(await appOrigin());
  return Response.json({ sent }, { headers: { "Cache-Control": "no-store" } });
}
