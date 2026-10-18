import { Suspense } from "react";
import { PageTransition } from "@/components/PageTransition";
import { and, asc, eq, inArray } from "drizzle-orm";
import { classTimes, serviceStaff, services, staff } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { requireBusiness } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { addClassTime, removeClassTime, saveService, setServiceStaff, toggleService } from "../actions";
import { formatMinutes } from "@/lib/time";

export default function ServicesPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="h-96 rounded-2xl bg-surface-2 animate-pulse" />}>
        <Services />
      </Suspense>
    </PageTransition>
  );
}

async function Services() {
  const { business } = await requireBusiness();
  const { t } = await getDict();
  const d = await db();
  const rows = await d.select().from(services).where(eq(services.businessId, business.id)).orderBy(asc(services.sortOrder), asc(services.createdAt));
  const members = await d.select().from(staff).where(and(eq(staff.businessId, business.id), eq(staff.active, true))).orderBy(asc(staff.sortOrder), asc(staff.createdAt));
  const links = rows.length ? await d.select().from(serviceStaff).where(inArray(serviceStaff.serviceId, rows.map((r) => r.id))) : [];
  const schedule = rows.length
    ? (await d.select().from(classTimes).where(inArray(classTimes.serviceId, rows.map((r) => r.id)))).sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute)
    : [];
  const staffName = (id: string) => members.find((m) => m.id === id)?.name ?? "";

  return (
    <div className="max-w-3xl stagger">
      <h1 className="display text-[40px] mb-5">{t.dash.services}</h1>
      <div className="card divide-y divide-line/50">
        <div className="hidden sm:grid grid-cols-[1fr_96px_88px_80px_168px] gap-3 px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wide">
          <span>{t.dash.name}</span>
          <span>{t.dash.duration}</span>
          <span>{t.dash.price}</span>
          <span title={t.dash.placesHint}>{t.dash.places}</span>
          <span />
        </div>
        {rows.map((s) => {
          const linked = links.filter((l) => l.serviceId === s.id).map((l) => l.staffId);
          const everyone = linked.length === 0;
          return (
          <div key={s.id}>
          <form action={saveService} className={`grid grid-cols-2 sm:grid-cols-[1fr_96px_88px_80px_168px] gap-3 px-4 py-3 items-center ${s.active ? "" : "opacity-55"}`}>
            <input type="hidden" name="id" value={s.id} />
            {!s.active && <span className="col-span-2 sm:col-span-5 chip bg-surface-2 text-muted w-fit">{t.dash.hiddenHint}</span>}
            <input name="name" defaultValue={s.name} required className="input col-span-2 sm:col-span-1" aria-label={t.dash.name} />
            <input name="duration" type="number" min={5} max={600} step={5} defaultValue={s.durationMinutes} required className="input tabular-nums" aria-label={t.dash.duration} />
            <input name="price" inputMode="decimal" defaultValue={s.priceCents === null ? "" : String(s.priceCents / 100)} placeholder="—" className="input tabular-nums" aria-label={t.dash.price} />
            <input name="capacity" type="number" min={1} max={200} defaultValue={s.capacity} className="input tabular-nums" aria-label={t.dash.places} title={t.dash.placesHint} />
            <div className="col-span-2 sm:col-span-1 flex gap-2 justify-end">
              <button className="btn-secondary btn-sm">{t.common.save}</button>
              <button formAction={toggleService.bind(null, s.id, !s.active)} formNoValidate className="btn-ghost btn-sm">
                {s.active ? t.dash.deactivate : t.dash.activate}
              </button>
            </div>
          </form>
          {s.capacity > 1 && (
            <div className="px-4 pb-3 -mt-1 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted mr-1">{t.dash.classSchedule}:</span>
                {schedule.filter((c) => c.serviceId === s.id).length === 0 && <span className="text-xs text-muted">{t.dash.classScheduleHint}</span>}
                {schedule
                  .filter((c) => c.serviceId === s.id)
                  .map((c) => (
                    <form key={c.id} action={removeClassTime.bind(null, c.id)}>
                      <button className="chip h-7 px-3 border border-line bg-surface gap-1.5 cursor-pointer hover:border-danger hover:text-danger" title={t.common.delete}>
                        <span className="tabular-nums">
                          {t.weekdaysShort[c.weekday - 1]} {formatMinutes(c.startMinute)}
                        </span>
                        {members.length > 1 && <span className="text-muted">· {staffName(c.staffId)}</span>}
                        <span aria-hidden>×</span>
                      </button>
                    </form>
                  ))}
              </div>
              <form action={addClassTime.bind(null, s.id)} className="flex flex-wrap items-center gap-1.5">
                <select name="weekday" defaultValue="1" className="input h-9 w-auto text-sm" aria-label={t.dash.classSchedule}>
                  {t.weekdays.map((w, i) => (
                    <option key={w} value={i + 1}>{w}</option>
                  ))}
                </select>
                <input name="time" type="time" step={300} defaultValue="18:00" required className="input h-9 w-28 text-sm tabular-nums" />
                <select name="staffId" className="input h-9 w-auto text-sm" aria-label={t.dash.staffName}>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button className="btn-secondary btn-sm">{t.dash.addClassTime}</button>
              </form>
            </div>
          )}
          {members.length > 1 && (
            <form className="flex flex-wrap items-center gap-1.5 px-4 pb-3 -mt-1">
              <span className="text-xs text-muted mr-1">
                {t.dash.whoDoes}
                {everyone ? ` · ${t.dash.everyone}` : ""}:
              </span>
              {members.map((m) => {
                const on = everyone || linked.includes(m.id);
                return (
                  <button
                    key={m.id}
                    formAction={setServiceStaff.bind(null, s.id, m.id, !on)}
                    aria-pressed={on}
                    className={`chip h-7 px-3 border transition-colors cursor-pointer ${on ? "bg-accent text-accent-ink border-accent" : "border-line text-muted hover:text-ink"}`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </form>
          )}
          </div>
          );
        })}
        <form action={saveService} className="grid grid-cols-2 sm:grid-cols-[1fr_96px_88px_80px_168px] gap-3 px-4 py-3 items-center bg-surface-2/50 rounded-b-2xl">
          <input name="name" required placeholder={t.dash.addService} className="input col-span-2 sm:col-span-1" />
          <input name="duration" type="number" min={5} max={600} step={5} defaultValue={30} required className="input tabular-nums" />
          <input name="price" inputMode="decimal" placeholder="—" className="input tabular-nums" />
          <input name="capacity" type="number" min={1} max={200} defaultValue={1} className="input tabular-nums" aria-label={t.dash.places} title={t.dash.placesHint} />
          <div className="col-span-2 sm:col-span-1 flex justify-end">
            <button className="btn-primary btn-sm">{t.common.add}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
