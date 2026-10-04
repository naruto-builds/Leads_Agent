// Returns an E.164 number like +919876543210, or null if it doesn't look valid.
export function normalizePhone(input, defaultCountryCode = '91') {
  if (typeof input !== 'string') return null;
  const hasPlus = input.trim().startsWith('+');
  let digits = input.replace(/\D/g, '');
  if (!digits) return null;

  if (!hasPlus) {
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) {
      digits = defaultCountryCode + digits.slice(1);
    } else if (digits.length === 10) digits = defaultCountryCode + digits;
  }

  if (!/^\d{8,15}$/.test(digits)) return null;
  if (digits.startsWith('91') && !/^91[6-9]\d{9}$/.test(digits)) return null; // Indian mobiles
  return `+${digits}`;
}