export const BANGLADESH_MOBILE_ERROR =
  'Enter a valid Bangladeshi mobile number';

export function normalizeBangladeshMobile(value: string): string | null {
  const digits = value.replace(/\D/g, '');

  let normalized = digits;
  if (digits.startsWith('8801')) {
    normalized = `0${digits.slice(3)}`;
  }

  if (!/^01[3-9]\d{8}$/.test(normalized)) {
    return null;
  }

  return normalized;
}
