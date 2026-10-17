import { Suspense } from "react";
import { asc, eq } from "drizzle-orm";
import { services } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { requireBusiness } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { saveService, toggleService } from "../actions";

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-surface-2 animate-pulse" />}>
      <Services />
    </Suspense>
  );
}

async function Services() {
  const { business } = await requireBusiness();
  const { t } = await getDict();
  const d = await db();
  const rows = await d.select().from(services).where(eq(services.businessId, business.id)).orderBy(asc(services.sortOrder), asc(services.createdAt));

  return (
    <div className="max-w-3xl">
      <h1 className="display text-[40px] mb-5">{t.dash.services}</h1>
      <div className="card divide-y divide-line">
        <div className="hidden sm:grid grid-cols-[1fr_110px_100px_180px] gap-3 px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">
          <span>{t.dash.name}</span>
          <span>{t.dash.duration}</span>
          <span>{t.dash.price}</span>
          <span />
        </div>
        {rows.map((s) => (
          <form key={s.id} action={saveService} className={`grid grid-cols-2 sm:grid-cols-[1fr_110px_100px_180px] gap-3 px-4 py-3 items-center ${s.active ? "" : "opacity-55"}`}>
            <input type="hidden" name="id" value={s.id} />
            {!s.active && <span className="col-span-2 sm:col-span-4 chip bg-surface-2 text-muted w-fit">{t.dash.hiddenHint}</span>}
            <input name="name" defaultValue={s.name} required className="input col-span-2 sm:col-span-1" aria-label={t.dash.name} />
            <input name="duration" type="number" min={5} max={600} step={5} defaultValue={s.durationMinutes} required className="input tabular-nums" aria-label={t.dash.duration} />
            <input name="price" inputMode="decimal" defaultValue={s.priceCents === null ? "" : String(s.priceCents / 100)} placeholder="—" className="input tabular-nums" aria-label={t.dash.price} />
            <div className="col-span-2 sm:col-span-1 flex gap-2 justify-end">
              <button className="btn-secondary btn-sm">{t.common.save}</button>
              <button formAction={toggleService.bind(null, s.id, !s.active)} formNoValidate className="btn-ghost btn-sm">
                {s.active ? t.dash.deactivate : t.dash.activate}
              </button>
            </div>
          </form>
        ))}
        <form action={saveService} className="grid grid-cols-2 sm:grid-cols-[1fr_110px_100px_180px] gap-3 px-4 py-3 items-center bg-surface-2/50 rounded-b-2xl">
          <input name="name" required placeholder={t.dash.addService} className="input col-span-2 sm:col-span-1" />
          <input name="duration" type="number" min={5} max={600} step={5} defaultValue={30} required className="input tabular-nums" />
          <input name="price" inputMode="decimal" placeholder="—" className="input tabular-nums" />
          <div className="col-span-2 sm:col-span-1 flex justify-end">
            <button className="btn-primary btn-sm">{t.common.add}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
