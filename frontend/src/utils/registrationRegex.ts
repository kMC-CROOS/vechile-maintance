/**
 * Regex utilities for Sri Lanka Vehicle Registration Documents
 */

// Sri Lankan Province prefixes
export const PROVINCE_PREFIXES = ['WP', 'CP', 'SP', 'NW', 'NP', 'EP', 'NC', 'SG', 'UP'];

// Sri Lankan Registration Plate Patterns
export const REGISTRATION_PATTERNS = [
  /^(?:(WP|CP|SP|NW|NP|EP|NC|SG|UP)\s+)?([A-Z]{1,3})[-.\s]?(\d{4})$/i,
  /^(\d{2,3})[-.\s](\d{4})$/,
];

// Sri Lankan NIC Patterns
export const NIC_PATTERNS = [
  /\b(\d{9}[VXvx])\b/,      // Old 9-digit NIC + V/X
  /\b(\d{12})\b/,           // New 12-digit NIC
];

// Chassis & Engine VIN Patterns
export const CHASSIS_PATTERN = /\b([A-Z0-9]{4,10}[-./\s]?[A-Z0-9]{5,12})\b/i;
export const ENGINE_PATTERN = /\b([A-Z0-9]{3,8}[-./\s]?[A-Z0-9]{4,12})\b/i;

// Year Pattern (1900 - 2099)
export const YEAR_PATTERN = /\b(19\d{2}|20[0-2]\d)\b/;

// Date Pattern (YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, DD-MM-YYYY)
export const DATE_PATTERN = /\b((?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)\d{2})\b/;

// Capacity Pattern (e.g. 1496 CC, 452 cc, 2000cc, 452)
export const CAPACITY_PATTERN = /(\d{2,5})\s*(?:CC|cc|CUBIC CAPACITY)?\b/i;

// Weight Pattern (e.g. 1380 KG, 196kg, 8500)
export const WEIGHT_PATTERN = /(\d{3,6})\s*(?:KG|kg|KGS)?\b/i;

/**
 * Validate Sri Lanka Registration Number format
 */
export function isValidRegistrationNumber(text: string): boolean {
  if (!text || text.trim().length < 4) return false;
  return REGISTRATION_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

/**
 * Validate Sri Lanka NIC format
 */
export function isValidNIC(text: string): boolean {
  if (!text) return false;
  return NIC_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

/**
 * Validate Year format YYYY
 */
export function isValidYear(text: string): boolean {
  if (!/^\d{4}$/.test(text.trim())) return false;
  const num = parseInt(text.trim(), 10);
  const currentYear = new Date().getFullYear();
  return !isNaN(num) && num >= 1900 && num <= currentYear + 1;
}
