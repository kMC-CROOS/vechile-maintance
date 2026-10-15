export function validNonNegativeNumber(value: string): boolean {
 return /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim()) && Number.isFinite(Number(value));
}
export function validDocumentDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function getLocalTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validateServiceEntry(date: string, odometer: string, cost: string, next: string): string | null {
  const todayStr = getLocalTodayString();
  if (!validDocumentDate(date) || date > todayStr) return 'Choose a valid service date that is not in the future.';
  if (!validNonNegativeNumber(odometer)) return 'Enter a valid, non-negative odometer reading.';
  if (!validNonNegativeNumber(cost)) return 'Enter a valid, non-negative service cost.';
  if (next && next.trim() && (!validNonNegativeNumber(next) || Number(next) <= Number(odometer))) return 'Next service reading must be greater than this service reading.';
  return null;
}
