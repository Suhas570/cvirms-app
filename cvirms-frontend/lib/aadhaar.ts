/**
 * Formats a raw Aadhaar string into standard 4-digit grouped format (XXXX XXXX XXXX)
 */
export function formatAadhaar(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * Validates that an Aadhaar number contains exactly 12 digits and is not all repeated digits
 */
export function isValidAadhaar(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 12) return false;
  if (/^(\d)\1{11}$/.test(digits)) return false;
  return true;
}
