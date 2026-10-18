// How business owners reach you. Change these before going live.
export const CONTACT = {
  /** Your Instagram username, without @ */
  instagram: "termin.me",
  /** Used for the WhatsApp and Viber links */
  phone: "+382 67 000 000",
  email: "info@termin.me",
};

const digits = CONTACT.phone.replace(/\D/g, "");
export const CONTACT_LINKS = {
  instagram: `https://instagram.com/${CONTACT.instagram}`,
  call: `tel:+${digits}`,
  viber: `viber://chat?number=%2B${digits}`,
  whatsapp: `https://wa.me/${digits}`,
};

/** Monthly price shown on the "Continue" card, e.g. "15 €". Leave null until you decide. */
export const PRICE_PER_MONTH: string | null = null;
