export function validNonNegativeNumber(value: string): boolean {
 return /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim()) && Number.isFinite(Number(value));
}
export function validDocumentDate(value: string): boolean {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const date = new Date(value + 'T00:00:00Z');
 return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateServiceEntry(date: string, odometer: string, cost: string, next: string): string | null {
 if (!validDocumentDate(date) || date > new Date().toISOString().slice(0, 10)) return 'Choose a valid service date that is not in the future.';
 if (!validNonNegativeNumber(odometer)) return 'Enter a valid, non-negative odometer reading.';
 if (!validNonNegativeNumber(cost)) return 'Enter a valid, non-negative service cost.';
 if (next.trim() && (!validNonNegativeNumber(next) || Number(next) <= Number(odometer))) return 'Next service reading must be greater than this service reading.';
 return null;
}
