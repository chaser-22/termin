// How business owners reach you. Change these before going live.
export const CONTACT = {
  /** Shown as text and used for call, Viber and WhatsApp links */
  phone: "+382 67 000 000",
  email: "info@termin.me",
};

const digits = CONTACT.phone.replace(/\D/g, "");
export const CONTACT_LINKS = {
  call: `tel:+${digits}`,
  viber: `viber://chat?number=%2B${digits}`,
  whatsapp: `https://wa.me/${digits}`,
};
