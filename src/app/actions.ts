"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { BUSINESS_TYPES, businesses, invites } from "@/db/schema";
import { DICTS, isLocale } from "@/i18n/dict";
import { getDict } from "@/i18n/server";
import { consumeLoginToken, createLoginToken, signOut, type Activation } from "@/lib/server/auth";
import { createBusinessWithDefaults, trialEnd, uniqueSlug } from "@/lib/server/setup";
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
  // Pages the browser already holds are in the old language; drop them all
  revalidatePath("/", "layout");
}

const bookSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.uuid(),
  staffId: z.uuid().nullable(),
  startsAt: z.iso.datetime(),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30),
  email: z.union([z.literal(""), z.email().max(120)]).optional(),
  note: z.string().trim().max(300).optional(),
});

export type BookState =
  | { ok: true; token: string }
  | { ok: false; error: "slot_taken" | "invalid" | "phone" | "name" | "error" };

export async function bookAppointment(input: z.input<typeof bookSchema>): Promise<BookState> {
  // Check the fields a person types first, so the message can say which one is wrong
  if (typeof input.name !== "string" || input.name.trim().length < 2) return { ok: false, error: "name" };
  const phone = typeof input.phone === "string" ? normalizePhone(input.phone) : null;
  if (!phone) return { ok: false, error: "phone" };
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

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
  revalidatePath(`/booking/${token}`);
}

export type LoginState = { status: "idle" } | { status: "sent"; email: string; devLink?: string } | { status: "error" };

export async function requestLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.email().max(120).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { status: "error" };
  return sendLoginLink(email.data);
}

async function sendLoginLink(email: string, activation?: Activation): Promise<LoginState> {
  const token = await createLoginToken(email, activation);
  const link = `${await appOrigin()}/auth/verify?token=${token}`;
  const { locale } = await getDict();
  const t = DICTS[locale];
  const sent = await sendEmail({
    to: email,
    subject: `${t.appName}: ${t.auth.loginTitle}`,
    text: `${t.auth.loginBody}\n\n${link}\n`,
  });
  // Without an email provider in development, show the link on screen.
  const devLink = !sent && !emailEnabled() && process.env.NODE_ENV !== "production" ? link : undefined;
  return { status: "sent", email: email, devLink };
}

/** Second step of email sign-in: a button press, so link scanners can't spend the token. */
export async function confirmLogin(token: string) {
  const session = await consumeLoginToken(token);
  if (session?.activation) await activateBusiness(session.userId, session.activation);
  const ok = !!session;
  // Pages fetched while signed out (e.g. a /dashboard that redirects to /login) are stale now
  if (ok) revalidatePath("/", "layout");
  redirect(ok ? "/dashboard" : "/login?error=1");
}

/** First sign-in from /start: create the business (from the invite, if any) and start the trial. */
async function activateBusiness(userId: string, a: Activation) {
  const d = await db();
  if (await d.query.businesses.findFirst({ where: eq(businesses.ownerId, userId) })) return;
  const { locale } = await getDict();
  const business = await createBusinessWithDefaults(d, {
    ownerId: userId,
    ownerName: a.name,
    name: a.name,
    slug: await uniqueSlug(d, a.name),
    type: a.type,
    locale,
    trialEndsAt: trialEnd(),
  });
  if (a.invite) await d.update(invites).set({ usedAt: new Date(), businessId: business.id }).where(eq(invites.code, a.invite));
}

const startSchema = z.object({
  email: z.email().max(120),
  invite: z.string().max(40).optional(),
  name: z.string().trim().min(2).max(80).optional(),
  type: z.enum(BUSINESS_TYPES).optional(),
});

/** /start: one form that sends the sign-in link and remembers what to create. */
export async function startTrial(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const val = (k: string) => {
    const v = String(fd.get(k) ?? "").trim();
    return v === "" ? undefined : v;
  };
  const parsed = startSchema.safeParse({ email: val("email")?.toLowerCase(), invite: val("invite"), name: val("name"), type: val("type") });
  if (!parsed.success) return { status: "error" };
  const { email, invite: code } = parsed.data;
  let activation: Activation;
  if (code) {
    const d = await db();
    const invite = await d.query.invites.findFirst({ where: eq(invites.code, code) });
    if (!invite || invite.usedAt) return { status: "error" };
    activation = { name: invite.businessName, type: invite.type, invite: code };
  } else {
    if (!parsed.data.name || !parsed.data.type) return { status: "error" };
    activation = { name: parsed.data.name, type: parsed.data.type };
  }
  return sendLoginLink(email, activation);
}

export async function logout() {
  await signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
