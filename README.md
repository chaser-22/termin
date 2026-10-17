# Termin — booking app (working name)

Online booking for barbers, salons, clinics and dentists in Montenegro.
Next.js 16 + TypeScript + PostgreSQL (Drizzle ORM). No payments, no paid messaging.

## What works today (first slice of Phase 1)

- **Public booking page** at `/<business-slug>`: service → staff (or "anyone") → day → time → name and phone. Contact details are remembered on the device for fast rebooking.
- **Booking page** at `/booking/<token>`: details, add to calendar (.ics with a 2-hour reminder), call, book again, cancel.
- **Business dashboard** (`/dashboard`, sign-in by email link, no passwords):
  - Day calendar with a column per staff member, working hours shaded, "now" line, bookings count and expected cash.
  - Booking details with Tel / Viber / WhatsApp buttons (WhatsApp opens with a pre-filled reminder), mark done / no-show / cancel.
  - Walk-in and phone bookings in two taps; clashes are refused.
  - Services (name, duration, price), staff, weekly hours with breaks, settings, booking link and QR code.
  - First sign-in runs a setup that adds starter services and hours for the business type.
- Montenegrin and English (switch in the header; default from the browser language).
- Double booking is prevented in the database transaction (staff rows are locked while a booking is checked and written).

## Run locally

```bash
npm install
npm run db:seed   # optional: demo barbershop at /marko, owner demo@example.com
npm run dev
```

No database to install: without `DATABASE_URL` the app uses an embedded Postgres in `.data/pglite`.
Stop the dev server before running `db:seed` (the embedded database allows one process).
To start over with only the demo data, stop the dev server and run `npm run db:reset`.
Copy the project without `.data` (some copy tools drop its empty folders, which breaks it); reset instead.
Without an email provider, the sign-in link is shown on screen in development.

```bash
npm test          # slot and time-zone logic
npm run typecheck
npm run lint
```

## Deploy on Vercel (free tier)

1. Push this folder to a GitHub repository and import it in Vercel.
2. In the Vercel project, open **Storage → Create Database → Neon (Postgres)** and connect it. This sets `DATABASE_URL`. Neon's free plan is enough to start.
3. Optional, for real emails: create a free [Resend](https://resend.com) account, verify your domain, and set `RESEND_API_KEY` and `EMAIL_FROM`.
4. Set `APP_URL` to your address (for example `https://termin.me`) once you have a domain.
5. Deploy. The build runs the database migrations first (`npm run build`).

Note: Vercel's free Hobby plan is for non-commercial use; a paid plan is needed once businesses pay you.

## Changing the database

Edit `src/db/schema.ts`, then `npm run db:generate` to create a migration in `drizzle/`. Locally it is applied on next start; on Vercel during the next build.

## Next steps (rest of Phase 1)

- Web push notifications and reminders (needs a service worker and a scheduled job; Vercel Cron on the free plan runs once a day, so reminders may need an external free cron).
- Waitlist for full days.
- Customer accounts across businesses (rebooking history).
- Time off / holidays per staff member, and drag-and-drop in the calendar.
