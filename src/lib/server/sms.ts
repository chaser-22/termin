import "server-only";

// SMS through Infobip's HTTP API. Infobip works across the Balkans and the same
// account can later send Viber business messages (after Viber approves the
// sender name), so reminders can move to Viber without changing providers.
// Without INFOBIP_BASE_URL / INFOBIP_API_KEY / SMS_FROM, messages are printed to
// the server log instead, like emails.

/** True when a real SMS provider is configured. */
export function smsEnabled(): boolean {
  return Boolean(process.env.INFOBIP_BASE_URL && process.env.INFOBIP_API_KEY && process.env.SMS_FROM);
}

/** Sends one SMS to an international number (+382...). Returns true when the provider accepted it. */
export async function sendSms({ to, text }: { to: string; text: string }): Promise<boolean> {
  if (!smsEnabled()) {
    console.log(`[sms] to=${to}\n${text}`);
    return false;
  }
  const base = process.env.INFOBIP_BASE_URL!.replace(/\/+$/, "");
  const res = await fetch(`${base.startsWith("http") ? base : `https://${base}`}/sms/2/text/advanced`, {
    method: "POST",
    headers: {
      Authorization: `App ${process.env.INFOBIP_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ messages: [{ destinations: [{ to: to.replace(/^\+/, "") }], from: process.env.SMS_FROM, text }] }),
  });
  if (!res.ok) {
    console.error(`[sms] send failed: ${res.status} ${await res.text()}`);
    return false;
  }
  return true;
}
