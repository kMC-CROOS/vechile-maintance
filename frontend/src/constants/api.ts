/**
 * VehicleCare API Configuration
 * SINGLE SOURCE OF TRUTH for API base URL across the entire application.
 * Never hardcode an IP address or host URL in any screen or component.
 */

// Change this line or set EXPO_PUBLIC_API_URL in .env if testing on a physical phone or custom IP.
const DEFAULT_API_HOST = 'http://127.0.0.1:8000';

export const API_BASE_HOST = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_HOST;
export const API_BASE_URL = `${API_BASE_HOST}/api`;

/**
 * Format asset URLs (e.g. storage links returned from backend)
 */
export const getStorageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_HOST}/${path.replace(/^\//, '')}`;
};
