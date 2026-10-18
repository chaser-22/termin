import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { businesses, loginTokens, sessions, users } from "@/db/schema";
import { randomToken, sha256 } from "./crypto";
import { readCookie } from "./cookies";
import { db } from "./db";

const SESSION_COOKIE = "session";
const SESSION_DAYS = 60;
const LOGIN_TOKEN_MINUTES = 20;

export async function createLoginToken(email: string): Promise<string> {
  const token = randomToken();
  const d = await db();
  await d.insert(loginTokens).values({
    tokenHash: sha256(token),
    email,
    expiresAt: new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000),
  });
  return token;
}

/** Spends a sign-in token. Returns false when it is unknown or expired. */
export async function consumeLoginToken(token: string): Promise<boolean> {
  const d = await db();
  const [row] = await d
    .delete(loginTokens)
    .where(and(eq(loginTokens.tokenHash, sha256(token)), gt(loginTokens.expiresAt, new Date())))
    .returning();
  if (!row) return false;

  const [user] = await d
    .insert(users)
    .values({ email: row.email })
    .onConflictDoUpdate({ target: users.email, set: { email: row.email } })
    .returning();

  const sessionToken = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await d.insert(sessions).values({ tokenHash: sha256(sessionToken), userId: user.id, expiresAt });
  (await cookies()).set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return true;
}

export async function getCurrentUser() {
  const token = await readCookie(SESSION_COOKIE);
  if (!token) return null;
  const d = await db();
  const [row] = await d
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())));
  return row?.user ?? null;
}

export async function signOut() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const d = await db();
    await d.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  store.delete(SESSION_COOKIE);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** The signed-in owner's business; sends them to setup if they have none yet. */
export async function requireBusiness() {
  const user = await requireUser();
  const d = await db();
  const business = await d.query.businesses.findFirst({ where: eq(businesses.ownerId, user.id) });
  if (!business) redirect("/dashboard/setup");
  return { user, business };
}
