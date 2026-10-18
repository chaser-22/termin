// Creating a business with starter data. No Next.js imports, so the seed
// script can use it too.
import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { businesses, classTimes, services, staff, workingHours, type BusinessType } from "@/db/schema";
import type { Locale } from "@/i18n/dict";
import { RESOURCE_TYPES, defaultHours, templateResources, templateSchedule, templateServices } from "@/lib/templates";

import { isValidSlug, slugify } from "@/lib/slug";
export { isValidSlug, slugify };

export type NewBusiness = {
  ownerId: string;
  ownerName: string;
  name: string;
  slug: string;
  type: BusinessType;
  city?: string | null;
  phone?: string | null;
  address?: string | null;
  locale: Locale;
  trialEndsAt?: Date | null;
};

export const TRIAL_DAYS = 3;
export const trialEnd = () => new Date(Date.now() + TRIAL_DAYS * 86_400_000);

/** A free web address made from the business name, with a number added if it is taken. */
export async function uniqueSlug(db: Db, name: string): Promise<string> {
  const base = slugify(name).slice(0, 34).replace(/-+$/, "") || "salon";
  let slug = isValidSlug(base) ? base : `${base}-1`;
  for (let n = 2; await db.query.businesses.findFirst({ where: eq(businesses.slug, slug) }); n++) slug = `${base}-${n}`;
  return slug;
}

export async function createBusinessWithDefaults(db: Db, input: NewBusiness) {
  return db.transaction(async (tx) => {
    const [business] = await tx
      .insert(businesses)
      .values({
        ownerId: input.ownerId,
        name: input.name,
        slug: input.slug,
        type: input.type,
        city: input.city ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        trialEndsAt: input.trialEndsAt ?? null,
      })
      .returning();
    // People-based businesses start with the owner; courts and rentals with two resources
    const bookables = RESOURCE_TYPES.includes(input.type)
      ? templateResources(input.type, input.locale).map((name, i) => ({ businessId: business.id, name, kind: "resource" as const, sortOrder: i }))
      : [{ businessId: business.id, name: input.ownerName, kind: "person" as const, sortOrder: 0 }];
    const created = await tx.insert(staff).values(bookables).returning();
    await tx.insert(workingHours).values(created.flatMap((b) => defaultHours(input.type).map((h) => ({ ...h, staffId: b.id }))));
    const createdServices = await tx
      .insert(services)
      .values(templateServices(input.type, input.locale).map((s) => ({ ...s, businessId: business.id })))
      .returning();
    // Classes start on a weekly schedule led by the first person
    const lead = created.find((b) => b.kind === "person");
    if (lead) {
      const rows = createdServices.flatMap((svc) =>
        templateSchedule(input.type, svc.sortOrder).map((c) => ({ ...c, serviceId: svc.id, staffId: lead.id })),
      );
      if (rows.length) await tx.insert(classTimes).values(rows);
    }
    return business;
  });
}
