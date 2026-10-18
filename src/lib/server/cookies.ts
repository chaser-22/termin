import "server-only";
import { cookies, headers } from "next/headers";

/**
 * Reads one cookie for rendering.
 *
 * Works around a Next.js 16.4 development-mode bug: when a server action
 * re-renders the page, `cookies()` can throw "Received an underlying cookies
 * object that does not match either `cookies` or `mutableCookies`" (see
 * node_modules/next/dist/server/request/cookies.js, dev-only branch). In that
 * one case we read the same value from the request's Cookie header. Every
 * other error, including Next's own rendering signals, is rethrown.
 */
export async function readCookie(name: string): Promise<string | undefined> {
  try {
    return (await cookies()).get(name)?.value;
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("does not match either `cookies` or `mutableCookies`")) throw err;
    const header = (await headers()).get("cookie") ?? "";
    for (const part of header.split(";")) {
      const [key, ...rest] = part.trim().split("=");
      if (key === name) return decodeURIComponent(rest.join("="));
    }
    return undefined;
  }
}
