// Creating a business with starter data. No Next.js imports, so the seed
// script can use it too.
import type { Db } from "@/db/client";
import { businesses, services, staff, workingHours, type BusinessType } from "@/db/schema";
import type { Locale } from "@/i18n/dict";
import { defaultHours, templateServices } from "@/lib/templates";

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
    const [owner] = await tx.insert(staff).values({ businessId: business.id, name: input.ownerName }).returning();
    await tx.insert(workingHours).values(defaultHours(input.type).map((h) => ({ ...h, staffId: owner.id })));
    await tx.insert(services).values(templateServices(input.type, input.locale).map((s) => ({ ...s, businessId: business.id })));
    return business;
  });
}
