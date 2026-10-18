// Creating a business with starter data. No Next.js imports, so the seed
// script can use it too.
import type { Db } from "@/db/client";
import { businesses, services, staff, workingHours, type BusinessType } from "@/db/schema";
import type { Locale } from "@/i18n/dict";
import { RESOURCE_TYPES, defaultHours, templateResources, templateServices } from "@/lib/templates";

export { isValidSlug, slugify } from "@/lib/slug";

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
};

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
      })
      .returning();
    // People-based businesses start with the owner; courts and rentals with two resources
    const bookables = RESOURCE_TYPES.includes(input.type)
      ? templateResources(input.type, input.locale).map((name, i) => ({ businessId: business.id, name, kind: "resource" as const, sortOrder: i }))
      : [{ businessId: business.id, name: input.ownerName, kind: "person" as const, sortOrder: 0 }];
    const created = await tx.insert(staff).values(bookables).returning();
    await tx.insert(workingHours).values(created.flatMap((b) => defaultHours(input.type).map((h) => ({ ...h, staffId: b.id }))));
    await tx.insert(services).values(templateServices(input.type, input.locale).map((s) => ({ ...s, businessId: business.id })));
    return business;
  });
}
