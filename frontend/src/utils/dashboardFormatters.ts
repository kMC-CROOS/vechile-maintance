/**
 * Dashboard formatting & helper utilities
 */

import { ImageSourcePropType } from 'react-native';

const VEHICLE_IMAGES: Record<string, ImageSourcePropType> = {
  car: require('../../assets/images/vehicles/car-hero.png'),
  bike: require('../../assets/images/vehicles/bike-hero.png'),
  three_wheeler: require('../../assets/images/vehicles/three_wheeler-hero.png'),
  van: require('../../assets/images/vehicles/van-hero.png'),
  bus: require('../../assets/images/vehicles/bus-hero.png'),
  truck: require('../../assets/images/vehicles/truck.png'),
  heavy_duty: require('../../assets/images/vehicles/heavy_duty.png'),
  tractor: require('../../assets/images/vehicles/tractor.png'),
};

/**
 * Returns full vehicle image source (remote photo URL or local asset default)
 */
export function getVehicleImageSource(
  category?: string | null,
  photoUrl?: string | null
): ImageSourcePropType {
  if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('file://'))) {
    return { uri: photoUrl };
  }

  const normalized = (category || 'car')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_');

  if (normalized.includes('bike') || normalized.includes('motorcycle') || normalized.includes('scooter')) {
    return VEHICLE_IMAGES.bike;
  }
  if (normalized.includes('three') || normalized.includes('tuk') || normalized.includes('auto')) {
    return VEHICLE_IMAGES.three_wheeler;
  }
  if (normalized.includes('van') || normalized.includes('suv')) {
    return VEHICLE_IMAGES.van;
  }
  if (normalized.includes('bus')) {
    return VEHICLE_IMAGES.bus;
  }
  if (normalized.includes('truck') || normalized.includes('lorry')) {
    return VEHICLE_IMAGES.truck;
  }
  if (normalized.includes('heavy')) {
    return VEHICLE_IMAGES.heavy_duty;
  }
  if (normalized.includes('tractor')) {
    return VEHICLE_IMAGES.tractor;
  }

  return VEHICLE_IMAGES.car;
}

/**
 * Format ISO date strings into clean, readable date string e.g. "30 Sep 2026"
 */
export function formatDisplayDate(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Not Set';
  try {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(dateObj.getTime())) return 'Not Set';
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).replace(/\bSept\b/, 'Sep');
  } catch {
    return 'Not Set';
  }
}

/**
 * Calculate exact days remaining from TODAY for an expiry date
 */
export function calculateDaysRemaining(expiryDateInput?: string | Date | null): number | null {
  if (!expiryDateInput) return null;
  try {
    const exp = typeof expiryDateInput === 'string' ? new Date(expiryDateInput) : expiryDateInput;
    if (isNaN(exp.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(exp);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export interface ExpiryStatusConfig {
  label: string;
  badgeText: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  status: 'valid' | 'upcoming' | 'expiring' | 'expired';
}

/**
 * Returns status color theme based on days remaining rule:
 * > 30 days: Green (#16A34A) - Valid
 * 8-30 days: Blue (#1769FF) - Upcoming
 * 1-7 days: Orange (#F59E0B) - Expiring Soon
 * <= 0 days: Red (#EF4444) - Expired
 */
export function getExpiryStatusConfig(daysLeft?: number | null): ExpiryStatusConfig {
  if (daysLeft === null || daysLeft === undefined) {
    return {
      label: 'Not Set',
      badgeText: 'Not Set',
      textColor: '#667085',
      bgColor: '#F2F4F7',
      borderColor: '#E4EAF2',
      status: 'valid',
    };
  }

  if (daysLeft <= 0) {
    const overdueDays = Math.abs(daysLeft);
    const text = overdueDays === 0 ? 'Expires Today' : `Expired ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} ago`;
    return {
      label: 'Expired',
      badgeText: text,
      textColor: '#EF4444',
      bgColor: '#FEF2F2',
      borderColor: '#FCA5A5',
      status: 'expired',
    };
  }

  if (daysLeft <= 7) {
    const text = daysLeft === 1 ? 'Expires tomorrow' : `Expires in ${daysLeft} days`;
    return {
      label: 'Expiring Soon',
      badgeText: `${daysLeft} days left`,
      textColor: '#F59E0B',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      status: 'expiring',
    };
  }

  if (daysLeft <= 30) {
    return {
      label: 'Upcoming',
      badgeText: `${daysLeft} days left`,
      textColor: '#1769FF',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      status: 'upcoming',
    };
  }

  return {
    label: 'Valid',
    badgeText: `${daysLeft} days left`,
    textColor: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    status: 'valid',
  };
}
