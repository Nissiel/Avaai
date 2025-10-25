/**
 * Convert technical identifiers (e.g., "john.smith" or "customer_support")
 * into human-friendly labels ("John Smith", "Customer Support").
 */
export function humanizeIdentifier(value: string | null | undefined): string {
  if (!value) return "";

  const trimmed = value.trim();
  if (trimmed.length === 0) return "";

  // Preserve phone-like strings (`+33123456789`, `123-456`) and email addresses.
  const isPhoneLike = /^[+\d\s()-]+$/.test(trimmed);
  const isEmail = /\S+@\S+\.\S+/.test(trimmed);
  if (isPhoneLike || isEmail) {
    return trimmed;
  }

  const cleaned = trimmed.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) {
    return trimmed;
  }

  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

