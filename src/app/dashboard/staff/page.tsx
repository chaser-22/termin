import { Suspense } from "react";
import { asc, eq, inArray } from "drizzle-orm";
import { staff, workingHours } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { requireBusiness } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { formatMinutes } from "@/lib/time";
import { saveStaff, toggleStaff } from "../actions";
import { HoursForm, type DayHours } from "./HoursForm";

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-surface-2 animate-pulse" />}>
      <StaffList />
    </Suspense>
  );
}

async function StaffList() {
  const { business } = await requireBusiness();
  const { t } = await getDict();
  const d = await db();
  const members = await d.select().from(staff).where(eq(staff.businessId, business.id)).orderBy(asc(staff.sortOrder), asc(staff.createdAt));
  const hours = members.length ? await d.select().from(workingHours).where(inArray(workingHours.staffId, members.map((m) => m.id))) : [];

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">{t.dash.staff} · {t.dash.hours}</h1>
      {members.map((m) => {
        const days: DayHours[] = Array.from({ length: 7 }, (_, i) => {
          const ranges = hours.filter((h) => h.staffId === m.id && h.weekday === i + 1).sort((a, b) => a.startMinute - b.startMinute);
          if (ranges.length === 0) return { open: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" };
          const first = ranges[0];
          const last = ranges[ranges.length - 1];
          return {
            open: true,
            from: formatMinutes(first.startMinute),
            to: formatMinutes(last.endMinute),
            breakFrom: ranges.length > 1 ? formatMinutes(first.endMinute) : "",
            breakTo: ranges.length > 1 ? formatMinutes(ranges[1].startMinute) : "",
          };
        });
        return (
          <section key={m.id} className={`card ${m.active ? "" : "opacity-60"}`}>
            <form action={saveStaff} className="flex items-center gap-2 p-4 border-b border-line">
              <input type="hidden" name="id" value={m.id} />
              <input name="name" defaultValue={m.name} required className="input max-w-xs font-medium" aria-label={t.dash.staffName} />
              <button className="btn-secondary btn-sm">{t.common.save}</button>
              {!m.active && <span className="chip bg-surface-2 text-muted">{t.dash.hiddenHint}</span>}
              <button formAction={toggleStaff.bind(null, m.id, !m.active)} formNoValidate className="btn-ghost btn-sm ml-auto">
                {m.active ? t.dash.deactivate : t.dash.activate}
              </button>
            </form>
            <HoursForm staffId={m.id} days={days} t={{ dash: t.dash, common: t.common, weekdays: t.weekdays }} />
          </section>
        );
      })}
      <form action={saveStaff} className="card p-4 flex gap-2">
        <input name="name" required placeholder={t.dash.staffName} className="input max-w-xs" />
        <button className="btn-primary">{t.dash.addStaff}</button>
      </form>
    </div>
  );
}
