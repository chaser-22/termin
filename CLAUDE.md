@AGENTS.md

# Termin

Online booking for appointment businesses in Montenegro: dentists, nail studios, barbers, massage,
fitness, sports courts, equipment rental and others. "Termin" is a working name.

- **Repo:** https://github.com/chaser-22/termin, default branch `main`
- **Owner sells through:** Instagram DMs and their own Instagram account, not in person
- **Languages:** Montenegrin (`me`, the main audience) and English (`en`)
- **Status (2026-11-09):** runs locally only. Nothing is deployed to production.

## Moving this folder

Nothing in the code or config depends on the folder's location, so the app works from anywhere.

1. **Stop the dev server first** (Ctrl+C in its window). The local database is held open while it runs.
2. Move the whole `booking-app` folder, including hidden items (`.git`, `.data`, `.claude`).
3. **Prefer a move (cut and paste) on the same drive.** Copy tools can drop the empty folders inside
   `.data/pglite`, which breaks the local database. If you must copy, use `robocopy` with `/E`:
   `robocopy "C:\old\booking-app" "D:\new\booking-app" /E`. If the database still breaks, run
   `npm run db:reset`; that replaces local data with fresh demo data.
4. Optional, to make it faster: delete `.next` (about 740 MB, rebuilt automatically) before moving.
   `node_modules` (about 670 MB) can move with it, or be deleted and restored with `npm install`.
5. Avoid synced folders such as OneDrive or Dropbox: they fight with the live database files.
6. In the new location run `npm run dev` and open http://localhost:3000.

The parent folder's `.claude/launch.json` (`termin-desktop`) is only a shortcut for opening Claude one
level up. It isn't needed if you open `booking-app` directly, which has its own `.claude/launch.json`.

Claude Code stores conversation history by folder path, so earlier sessions won't appear under the new
location. This file is what carries the context across.

## Commands

Run everything from the `booking-app` folder.

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start at http://localhost:3000 |
| `npm test` | Unit tests (vitest; 47 tests) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run build` | Migrations (only when `DATABASE_URL` is set), then production build |
| `npm run db:generate` | Create a migration in `drizzle/` after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` (does nothing locally) |
| `npm run db:seed` | Add demo businesses (safe to re-run) |
| `npm run db:reset` | Delete the local database and re-seed |
| `npx tsx scripts/invite.ts "Business name" barber` | Make a personal invite link (`/p/<code>`) |

`db:seed`, `db:reset` and `invite` need the **dev server stopped**: the local database allows one process.

To open it on a phone on the same Wi-Fi, use `http://<computer-ip>:3000` (find the IPv4 address with
`ipconfig`). Live reload doesn't work over that address, but the app does.

## Stack

- **Next.js 16.4.2** App Router, `cacheComponents: true`, `partialPrefetching: true`, Turbopack
- **React 19.3** (uses `ViewTransition`, and Next's `Activity` behaviour; see Gotchas)
- **TypeScript**, import alias `@/` → `src/`
- **Tailwind CSS v4** (`@theme inline`, `@utility`), all in `src/app/globals.css`
- **Drizzle ORM** on Postgres: Neon in production, embedded **PGlite** locally at `.data/pglite`
- **zod** for validation, **lucide-react** for icons, **date-fns** with `@date-fns/tz` for time zones
- **Vitest** for tests
- Fonts: Bricolage Grotesque (display), Plus Jakarta Sans (body)

This Next.js has breaking changes from older versions. Read `node_modules/next/dist/docs/` before
writing framework code, especially `01-app/02-guides/preserving-ui-state.md`.

## Environment variables

There is no `.env` file locally and none is needed. See `.env.example`.

| Variable | Without it |
|---|---|
| `DATABASE_URL` | Uses the embedded local database |
| `APP_URL` | Detected from the request |
| `RESEND_API_KEY`, `EMAIL_FROM` | Emails print to the server log; in development the sign-in link appears on screen |
| `CRON_SECRET` | Reminder route is open in development and refused in production |
| `INFOBIP_BASE_URL`, `INFOBIP_API_KEY`, `SMS_FROM` | SMS messages print to the server log |

## Routes

| Route | Purpose |
|---|---|
| `/` | Marketing homepage |
| `/za/[vertical]` | Industry landing page, linked from the homepage cards |
| `/start`, `/start?type=<type>` | Free-trial sign-up (name, type, email; no password) |
| `/p/[code]` | Personal invitation you send to a business |
| `/login`, `/auth/verify` | Email-link sign-in |
| `/dashboard` + `/services`, `/staff`, `/settings`, `/setup` | Owner area |
| `/[slug]` | A business's public booking page; `?preview=1` saves nothing |
| `/booking/[token]` | Client's confirmation page: view, cancel, add to calendar |
| `/booking/[token]/calendar.ics` | Calendar file |
| `/api/slots` | Available times |
| `/api/cron/reminders` | Daily reminders (Vercel Cron, `0 16 * * *`, see `vercel.json`) |
| `/privacy` | Bilingual privacy page |

Slugs in `RESERVED_SLUGS` (`src/lib/slug.ts`) can't be used by businesses. Any unknown top-level path
reaches `/[slug]` and shows its own "doesn't exist" message; `src/app/not-found.tsx` handles the rest.

## Code map

```
src/app/page.tsx              Homepage layout
src/app/PillHeader.tsx        Desktop floating header: shrinks on scroll down, opens on scroll up or Tab
src/app/IndustryCarousel.tsx  Scroll-snap carousel with the animated client/owner split demo
src/app/FeatureTiles.tsx      "Šta još dobijate" tiles; copy in features.ts
src/app/HomeMore.tsx          Steps, FAQ, final sign-up; copy in homeEnd.ts
src/app/FaqItem.tsx           Animated FAQ row
src/app/actions.ts            Public server actions: booking, login, sign-up, language
src/app/dashboard/actions.ts  Owner server actions
src/app/[slug]/BookingFlow.tsx  Client booking steps
src/components/PageBrand.tsx  Applies a brand colour to a whole page; read its comment first
src/components/HtmlLang.tsx   Keeps <html lang> and titles in the visitor's language
src/components/DeadEnd.tsx    Error message with a link home
src/db/schema.ts              Tables
src/db/client.ts              Chooses Neon or PGlite
src/i18n/dict.ts              All UI text, in `me` and `en`
src/i18n/server.ts            getDict(): language from the `lang` cookie, else the browser
src/lib/brand.ts              The 7 brand colours, each with light and dark shades
src/lib/verticals.ts          Industry content, demos and accent colours
src/lib/templates.ts          Starter services and hours per business type
src/lib/terms.ts              Per-industry wording
src/lib/slots.ts              Pure availability logic (tested)
src/lib/server/booking.ts     Slots and createBooking
src/lib/server/notify.ts      Owner notifications and client reminders
src/lib/server/setup.ts       New-business creation; TRIAL_DAYS lives here
src/lib/server/auth.ts        Email-link tokens and sessions
src/lib/contact.ts            Your contact details and PRICE_PER_MONTH
src/app/privacy/content.ts    Privacy text and OPERATOR details
```

**Homepage order:** `PillHeader` → headline, subtitle, "Počnite besplatno", trust ticks → heading
"Pogledajte kako radi za vaš posao" → carousel (chip row on desktop only) → phone-only "Ili izaberite
direktno" list → `FeatureTiles` → "Kako počinjete" → "Česta pitanja" → final sign-up block → footer.

**Data model:** `users`, `login_tokens`, `sessions`, `businesses`, `invites`, `staff`, `services`,
`service_staff`, `working_hours`, `class_times`, `customers`, `bookings`. One owner has one business.
Business defaults are `Europe/Podgorica` and `EUR`.

**Business types:** `barber, salon, nails, beauty, massage, dentist, clinic, fitness, court, rental, other`.

**Double-booking protection:** `createBooking` locks the staff row inside a transaction, then re-checks
availability. Bookings added from the dashboard go through the same clash check.

**Local demo data:** `/marko`, `/demo-nokti`, `/demo-stomatolog`, `/demo-masaza`, `/demo-joga`,
`/demo-padel`, `/demo-rent`. To enter a demo dashboard, sign in at `/login` with `demo@example.com`;
the sign-in link appears on screen.

## Colour system

- **Teal (`adriatic`) is the Termin brand:** headline accent, sign-up buttons, ticks, later homepage sections.
- **Industry colour** on the homepage applies only to the demo card and its arrow and dots, via
  `[data-accent="<slug>"]`. Feature tiles deliberately stay teal.
- **`/za/...` pages** use that industry's colour across the page.
- **Booking pages and the dashboard** use the business's chosen `brandColor`.
- A whole-page colour must always go through `PageBrand`, never a bare `<style>` (see Gotchas).

## Gotchas learned the hard way

**Pages you leave stay alive, hidden.** With Cache Components, Next keeps up to 3 previous routes mounted
under `<Activity>`. Anything global they set (CSS variables, `:root` styles) keeps applying to the visible
page. `PageBrand` handles this: a rule made in the browser starts off, and turns on only while its page is
visible. A hidden page can also be rebuilt (logging out does this), which is why it must start off.

**Stale styles after CSS changes.** New keyframes in `globals.css`, or a production build while the dev
server runs, can leave the dev server serving old CSS. Pages then look like an old design though the code
is right. Fix:

Stop the dev server, delete the `.next` folder, then run `npm run dev` again. To delete it from a terminal:
`rmdir /s /q .next` in Command Prompt, or `Remove-Item -Recurse -Force .next` in PowerShell.

**Stuck database lock.** If the server was killed and the database won't open, and no `node` process is
running, delete `.data/pglite/postmaster.pid`. If the database is corrupt, move `.data/pglite` aside and
run `npm run db:seed` to recreate it.

**`next dev` rewrites `AGENTS.md`.** Its generated block returns if removed; leave it alone.

**Runtime data needs a Suspense boundary.** Anything reading cookies, headers or the database must sit
under `<Suspense>`. The root layout is static, so `<html lang>` is corrected on the client by `HtmlLang`.

**Testing in Claude's built-in browser while it's hidden.** It only draws frames when forced, so smooth
scrolling, transitions and page changes appear to hang. Taking a screenshot forces a frame. Don't call
something broken until it's been checked with frames forced. Native `confirm()` dialogs also can't be
answered there, so override `window.confirm` when testing cancel.

**Don't run a second server against the local database.** It allows one process, and sharing it risks
corrupting it. That's why the production server hasn't been tested locally.

## Working agreements

- **Ask before merging or pushing to `main`, and before any production deployment.** Each approval
  covers that one action.
- Work on a `design/<name>` branch off `main`. After merging, delete the branch so only `main` remains.
- **The owner decides on designs.** When asked for an opinion, give a recommendation and reasons.
- **Show only real, implemented features.** No fake testimonials, data or customer numbers.
- Keep things simple. Desktop homepage is the current focus, but check phones too (down to 320px).
- Every piece of UI text goes in **both languages**. Montenegrin uses ijekavian forms such as "sjutra".
- Before merging, run lint, typecheck, tests and a production build.
- Verify visible changes in the browser; report honestly what was and wasn't checked.
- Match the existing code: short comments that explain why, small components, no new libraries without need.

## Before going live

- [ ] Replace placeholders in `src/lib/contact.ts` (Instagram, phone, email). The FAQ's price answer sends people there.
- [ ] Set `PRICE_PER_MONTH` in `src/lib/contact.ts`. Reconsider `TRIAL_DAYS` in `src/lib/server/setup.ts`, currently 3.
- [ ] Fill in `OPERATOR` in `src/app/privacy/content.ts`, and have the text checked against Montenegrin data protection law.
- [ ] Decide on the final name and domain.
- [ ] Deploy: Vercel + Neon. Set `DATABASE_URL`, `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `INFOBIP_*`.
- [ ] Note: Vercel's free Hobby plan is non-commercial; paying customers need a paid plan.
- [ ] Add `robots.txt` and a sitemap. `/robots.txt` currently reaches the business-page route.

## Current state

**Not yet tested:** the production server, real phones, Safari and Firefox, real email and SMS delivery,
whether bad URLs return a real 404 status in production, and how animations feel in motion.

**Other branch:** `design/header-tab` is unmerged and holds an alternative header and an unused logo mark
(`src/components/TerminMark.tsx`). Keep it until the logo is decided.

**Local test data:** `qa-owner@example.test` with the business "Test Studio QA" (`/test-studio-qa`) and one
cancelled booking at Nail Studio Lena. Harmless; `npm run db:reset` removes them. Production starts empty.

**Ideas not started:** web push notifications, waitlist, client accounts across businesses, staff time off,
drag-and-drop calendar.

`README.md` is older than this file and partly out of date; trust this file and the code.
