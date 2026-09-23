import { mapFuelType } from './fuelTypeMapper';
import { mapVehicleCategory } from './vehicleCategoryMapper';
import { REGISTRATION_PATTERNS, NIC_PATTERNS } from './registrationRegex';

/**
 * Normalizes extra spaces, leading/trailing whitespace and OCR line-break noise.
 */
export function normalizeWhitespace(text?: string | null): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || null;
}

/**
 * Normalizes Sri Lanka Registration Number:
 * - Trims whitespace
 * - Converts registration letters to uppercase
 * - Preserves hyphens
 * - Standardizes formatting (e.g. "WP CAB 1234" -> "WP CAB-1234", "wp bike-8849" -> "WP BIKE-8849")
 */
export function normalizeRegistrationNumber(text?: string | null): string | null {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return null;

  const upper = cleaned.toUpperCase();

  // Try matching standard registration regex patterns
  for (const pattern of REGISTRATION_PATTERNS) {
    const match = upper.match(pattern);
    if (match) {
      if (match.length === 4) return `${match[1] ? match[1] + ' ' : ''}${match[2]}-${match[3]}`;
      return `${match[1]}-${match[2]}`;
    }
  }

  // Reject unreadable or mixed text instead of inventing a plate.
  return null;
}

/**
 * Normalizes Sri Lanka NIC / ID Number:
 * Supports old 9-digit + V/X (e.g. 881940192V) and new 12-digit (e.g. 200012345678).
 */
export function normalizeNIC(text?: string | null): string | null {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return null;

  const upper = cleaned.toUpperCase();

  for (const pattern of NIC_PATTERNS) {
    const match = upper.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return upper;
}

/**
 * Normalizes Chassis / Frame VIN number:
 * Conservative trimming preserving original characters, numbers, slashes, hyphens.
 */
export function normalizeChassisNumber(text?: string | null): string | null {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return null;

  return /^[A-Z0-9][A-Z0-9/ -]{3,29}$/i.test(cleaned) && /\d/.test(cleaned)
    ? cleaned.replace(/\s/g, '').toUpperCase() : null;
}

export const normalizeEngineNumber = normalizeChassisNumber;

export function normalizeCylinderCapacity(text?: string | null): string | null {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return null;

  const match = cleaned.match(/^(\d{1,5}(?:\.\d+)?)\s*(?:CC|CM3|CM\u00b3)?$/i);
  return match ? `${match[1]} cc` : null;
}

export function normalizeWeight(text?: string | null): string | null {
  const cleaned = normalizeWhitespace(text);
  const match = cleaned?.match(/^(\d{1,6}(?:\.\d+)?)\s*(?:KG|KGS)?$/i);
  return match ? `${match[1]} kg` : null;
}

export function normalizeDate(text?: string | null): string | null {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return null;
  const iso = cleaned.match(/^((?:19|20)\d{2})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  const dmy = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.]((?:19|20)\d{2})$/);
  if (!iso && !dmy) return null;
  const [year, month, day] = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : [Number(dmy![3]), Number(dmy![2]), Number(dmy![1])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export { mapFuelType as normalizeFuelType };
export { mapVehicleCategory as normalizeVehicleCategory };
