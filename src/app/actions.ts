"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { businesses } from "@/db/schema";
import { DICTS, isLocale } from "@/i18n/dict";
import { getDict } from "@/i18n/server";
import { createLoginToken, signOut } from "@/lib/server/auth";
import { cancelByToken, createBooking } from "@/lib/server/booking";
import { db } from "@/lib/server/db";
import { emailEnabled, sendEmail } from "@/lib/server/email";
import { appOrigin } from "@/lib/server/url";
import { normalizePhone } from "@/lib/phone";
import { formatDateLong } from "@/lib/format";
import { dateKeyOf, formatTime } from "@/lib/time";

export async function setLanguage(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set("lang", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  refresh();
}

const bookSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.uuid(),
  staffId: z.uuid().nullable(),
  startsAt: z.iso.datetime(),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(30),
  email: z.union([z.literal(""), z.email().max(120)]).optional(),
  note: z.string().trim().max(300).optional(),
});

export type BookState =
  | { ok: true; token: string }
  | { ok: false; error: "slot_taken" | "invalid" | "phone" | "error" };

export async function bookAppointment(input: z.input<typeof bookSchema>): Promise<BookState> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  const phone = normalizePhone(data.phone);
  if (!phone) return { ok: false, error: "phone" };

  const d = await db();
  const business = await d.query.businesses.findFirst({ where: eq(businesses.slug, data.slug) });
  if (!business) return { ok: false, error: "invalid" };

  try {
    const result = await createBooking({
      business,
      serviceId: data.serviceId,
      staffId: data.staffId,
      startsAt: new Date(data.startsAt),
      name: data.name,
      phone,
      email: data.email || null,
      note: data.note || null,
      source: "online",
    });
    if (!result.ok) return result;

    const email = data.email;
    if (email) {
      const { locale, t } = await getDict();
      const origin = await appOrigin();
      const start = new Date(data.startsAt);
      const when = `${formatDateLong(dateKeyOf(start, business.timezone), t, locale)} ${formatTime(start, business.timezone)}`;
      // Sent after the response, so a slow email doesn't slow the booking.
      after(() => sendEmail({
        to: email,
        subject: `${t.booking.confirmedTitle}: ${business.name}, ${when}`,
        text: `${t.booking.confirmedTitle}\n\n${business.name}\n${when}\n${business.address ?? ""}\n\n${t.booking.saveLink}\n${origin}/booking/${result.publicToken}`,
      }));
    }
    return { ok: true, token: result.publicToken };
  } catch (err) {
    console.error("bookAppointment failed", err);
    return { ok: false, error: "error" };
  }
}

export async function cancelBooking(token: string) {
  await cancelByToken(token);
  refresh();
}

export type LoginState = { status: "idle" } | { status: "sent"; email: string; devLink?: string } | { status: "error" };

export async function requestLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.email().max(120).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { status: "error" };
  const token = await createLoginToken(email.data);
  const link = `${await appOrigin()}/auth/verify?token=${token}`;
  const { locale } = await getDict();
  const t = DICTS[locale];
  const sent = await sendEmail({
    to: email.data,
    subject: `${t.appName}: ${t.auth.loginTitle}`,
    text: `${t.auth.loginBody}\n\n${link}\n`,
  });
  // Without an email provider in development, show the link on screen.
  const devLink = !sent && !emailEnabled() && process.env.NODE_ENV !== "production" ? link : undefined;
  return { status: "sent", email: email.data, devLink };
}

export async function logout() {
  await signOut();
  redirect("/login");
}
