/**
 * Formatting utilities for currency, numbers, and dates
 */

export const formatCurrency = (amount: number | string | null | undefined, currency = 'LKR'): string => {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatOdometer = (km: number | string | null | undefined): string => {
  const num = Number(km) || 0;
  return `${num.toLocaleString('en-US')} km`;
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
};
