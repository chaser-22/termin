import { Suspense } from "react";
import { PageTransition } from "@/components/PageTransition";
import QRCode from "qrcode";
import { getDict } from "@/i18n/server";
import { requireBusiness } from "@/lib/server/auth";
import { appOrigin } from "@/lib/server/url";
import { CopyLink } from "../CopyLink";
import { SettingsForm } from "./SettingsForm";

export default function SettingsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="h-96 rounded-2xl bg-surface-2 animate-pulse" />}>
        <Settings />
      </Suspense>
    </PageTransition>
  );
}

async function Settings() {
  const { business } = await requireBusiness();
  const { locale, t } = await getDict();
  const origin = await appOrigin();
  const link = `${origin}/${business.slug}`;
  const qrSvg = await QRCode.toString(link, { type: "svg", margin: 1, color: { dark: "#1b1a17", light: "#ffffff" } });
  const qrHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px] items-start max-w-5xl stagger">
      <div>
        <h1 className="display text-[40px] mb-5">{t.dash.settings}</h1>
        <SettingsForm
          host={origin.replace(/^https?:\/\//, "")}
          business={{
            name: business.name,
            slug: business.slug,
            type: business.type,
            phone: business.phone ?? "",
            address: business.address ?? "",
            city: business.city ?? "",
            description: business.description ?? "",
            minNoticeMinutes: business.minNoticeMinutes,
            maxDaysAhead: business.maxDaysAhead,
            slotStepMinutes: business.slotStepMinutes,
            brandColor: business.brandColor,
          }}
          locale={locale}
          t={{ dash: t.dash, common: t.common, businessTypes: t.businessTypes }}
        />
      </div>
      <aside className="card p-5 space-y-4 order-first lg:order-none lg:mt-[68px]">
        <p className="text-sm font-medium">{t.dash.bookingLink}</p>
        <CopyLink url={link} copyLabel={t.dash.copy} copiedLabel={t.dash.copied} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrHref} alt="QR" className="w-full rounded-xl border border-line" />
        <a href={qrHref} download={`${business.slug}-qr.svg`} className="btn-secondary w-full">
          {t.dash.downloadQr}
        </a>
      </aside>
    </div>
  );
}
