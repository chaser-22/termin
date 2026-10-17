import "server-only";

type Email = { to: string; subject: string; text: string; html?: string };

/** True when a real email provider is configured. */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Sends through Resend's HTTP API (free tier: 3,000 emails/month).
 * Without RESEND_API_KEY the email is printed to the server log instead.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  if (!emailEnabled()) {
    console.log(`[email] to=${email.to} subject="${email.subject}"\n${email.text}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: email.to, subject: email.subject, text: email.text, html: email.html }),
  });
  if (!res.ok) {
    console.error(`[email] send failed: ${res.status} ${await res.text()}`);
    return false;
  }
  return true;
}
