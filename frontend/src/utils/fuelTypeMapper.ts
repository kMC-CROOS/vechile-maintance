/**
 * Maps raw OCR fuel strings to app fuel cards:
 * - Petrol
 * - Diesel
 * - Electric
 * - CNG
 * - Hybrid
 */
export function mapFuelType(rawFuelText?: string | null): string | null {
  if (!rawFuelText) return null;

  const text = rawFuelText.trim().toUpperCase();

  if (text.includes('HYBRID') || text.includes('PLUG-IN')) {
    return 'Hybrid';
  }
  if (text.includes('PETROL') || text.includes('GASOLINE') || text.includes('UNLEADED') || text.includes('BENZINE')) {
    return 'Petrol';
  }
  if (text.includes('DIESEL') || text.includes('TURBO DIESEL') || text.includes('OIL')) {
    return 'Diesel';
  }
  if (text.includes('ELECTRIC') || text.includes('EV') || text.includes('BATTERY') || text.includes('BEV')) {
    return 'Electric';
  }
  if (text.includes('CNG') || text.includes('COMPRESSED') || text.includes('LPG') || text.includes('GAS')) {
    return 'CNG';
  }

  return null;
}
