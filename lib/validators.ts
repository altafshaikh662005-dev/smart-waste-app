export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isNonEmpty(value: string | null | undefined) {
  return !!value && value.trim().length > 0;
}

export function parseNumber(value: FormDataEntryValue | null, fallback: number | null = null) {
  if (value === null) return fallback;
  const num = typeof value === "string" ? parseFloat(value) : NaN;
  return Number.isFinite(num) ? num : fallback;
}

