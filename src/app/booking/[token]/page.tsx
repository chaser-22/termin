import { Suspense } from "react";
import Link from "next/link";
import { CalendarPlus, MapPin, Phone, RotateCcw } from "lucide-react";
import { getDict } from "@/i18n/server";
import { brandCss } from "@/lib/brand";
import { getBookingByToken } from "@/lib/server/booking";
import { formatPrice } from "@/lib/format";
import { dateKeyOf, formatTime, isPast, isoWeekday, parseDateKey } from "@/lib/time";
import { Odometer } from "@/components/Odometer";
import { CancelButton } from "./CancelButton";
import { ShareButton } from "./ShareButton";

export default function BookingPage({ params }: PageProps<"/booking/[token]">) {
  return (
    <main className="flex-1 mx-auto w-full max-w-md px-4 py-8 sm:py-14">
      <Suspense fallback={<div className="h-[560px] rounded-3xl bg-surface-2 animate-pulse" />}>
        <BookingDetails params={params} />
      </Suspense>
    </main>
  );
}

async function BookingDetails({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { locale, t } = await getDict();
  const data = await getBookingByToken(token);
  if (!data) return <p className="card p-8 text-center text-muted">{t.booking.notFound}</p>;
  const { booking, business, service, staff } = data;
  const tz = business.timezone;
  const cancelled = booking.status === "cancelled";
  const past = isPast(booking.startsAt);
  const dayKey = dateKeyOf(booking.startsAt, tz);
  const { m, d } = parseDateKey(dayKey);
  const weekday = t.weekdays[isoWeekday(dayKey) - 1];
  const dateLine = locale === "me" ? `${weekday}, ${d}. ${t.monthsLong[m - 1]}` : `${weekday}, ${d} ${t.monthsLong[m - 1]}`;
  const mapUrl = business.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, business.address, business.city].filter(Boolean).join(", "))}`
    : null;

  return (
    <div>
      <style>{brandCss(business.brandColor)}</style>

      {/* Headline */}
      <div className="text-center mb-7">
        {cancelled ? (
          <div className="mx-auto grid place-items-center size-16 rounded-full bg-surface-2 text-muted text-2xl animate-pop">×</div>
        ) : (
          <div className="mx-auto grid place-items-center size-16 rounded-full bg-accent text-accent-ink shadow-[0_12px_32px_-10px_var(--accent)] animate-pop">
            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" className="animate-draw" />
            </svg>
          </div>
        )}
        <p className="eyebrow mt-5 animate-rise [animation-delay:120ms]">{cancelled ? t.booking.cancelledTitle : t.booking.confirmedTitle}</p>
        <h1 className="display text-[44px] mt-1.5 animate-rise [animation-delay:180ms]">{cancelled ? business.name : t.booking.seeYou}</h1>
        {cancelled && <p className="mt-2 text-muted text-sm max-w-xs mx-auto">{t.booking.cancelledBody}</p>}
      </div>

      {/* Ticket */}
      <div className="card overflow-hidden shadow-lift animate-rise [animation-delay:240ms]">
        <div className="relative px-6 pt-6 pb-7">
          <p className="eyebrow">{t.booking.yourBooking}</p>
          <p className={`display text-[26px] mt-2.5 ${cancelled ? "line-through text-muted" : ""}`}>{dateLine}</p>
          <p className={`mt-3 flex flex-col gap-1.5 ${cancelled ? "line-through text-muted opacity-60" : ""}`}>
            <Odometer value={formatTime(booking.startsAt, tz)} className={`display text-[clamp(44px,15vw,60px)] ${cancelled ? "" : "text-accent"}`} />
            <span className="text-muted text-[15px] font-medium tabular-nums">
              {formatTime(booking.startsAt, tz)} – {formatTime(booking.endsAt, tz)}
            </span>
          </p>
        </div>

        {/* Perforation */}
        <div className="relative h-0 border-t-2 border-dashed border-line mx-6">
          <span className="absolute -left-[37px] -top-[13px] size-6 rounded-full bg-bg border border-line" />
          <span className="absolute -right-[37px] -top-[13px] size-6 rounded-full bg-bg border border-line" />
        </div>

        <dl className="px-6 py-5 space-y-3.5 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t.booking.service}</dt>
            <dd className="text-right font-medium">
              {service.name} <span className="text-muted font-normal">· {formatPrice(service.priceCents, t.common.priceOnRequest)}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t.booking.staff}</dt>
            <dd className="text-right font-medium">{staff.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t.booking.where}</dt>
            <dd className="text-right">
              <span className="font-medium">{business.name}</span>
              {business.address && (
                <span className="block text-muted text-sm">
                  {business.address}
                  {business.city ? `, ${business.city}` : ""}
                </span>
              )}
            </dd>
          </div>
        </dl>

        <div className="px-6 pb-6 space-y-2.5">
          {!cancelled && !past && (
            <a href={`/booking/${token}/calendar.ics`} className="btn-primary w-full h-12">
              <CalendarPlus className="size-[18px]" /> {t.booking.addToCalendar}
            </a>
          )}
          <div className="grid grid-cols-3 gap-2.5">
            {business.phone && (
              <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="btn-secondary btn-sm h-11 px-2">
                <Phone className="size-4" /> {t.booking.call}
              </a>
            )}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm h-11 px-2">
                <MapPin className="size-4" /> {t.book.directions}
              </a>
            )}
            <ShareButton label={t.booking.share} copiedLabel={t.booking.copied} title={`${business.name} · ${dateLine} ${formatTime(booking.startsAt, tz)}`} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 text-center animate-rise [animation-delay:320ms]">
        <Link href={`/${business.slug}`} className="btn-ink w-full h-12">
          <RotateCcw className="size-4" /> {cancelled || past ? t.booking.bookAgain : t.booking.bookNext}
        </Link>
        {!cancelled && !past && <CancelButton token={token} label={t.booking.cancelBooking} confirmText={t.booking.cancelConfirm} />}
        {!cancelled && <p className="text-xs text-muted pt-1">{t.booking.saveLink}</p>}
      </div>
    </div>
  );
}
