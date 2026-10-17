// Minimal iCalendar (RFC 5545) event, opened by Google, Apple and Outlook calendars.

function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

export function buildIcs(event: {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  cancelled?: boolean;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Termin//Booking//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${event.cancelled ? "CANCEL" : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escape(event.title)}`,
    event.description ? `DESCRIPTION:${escape(event.description)}` : "",
    event.location ? `LOCATION:${escape(event.location)}` : "",
    event.url ? `URL:${event.url}` : "",
    `STATUS:${event.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    // Phone reminder two hours before
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "TRIGGER:-PT2H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}
