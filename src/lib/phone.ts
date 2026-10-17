/**
 * Normalizes a phone number to international form, assuming Montenegro (+382)
 * for local numbers: "067 123 456" → "+38267123456".
 */
export function normalizePhone(input: string): string | null {
  let p = input.replace(/[\s\-().\/]/g, "");
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  else if (p.startsWith("0")) p = `+382${p.slice(1)}`;
  else if (!p.startsWith("+")) p = `+382${p}`;
  return /^\+\d{8,15}$/.test(p) ? p : null;
}
