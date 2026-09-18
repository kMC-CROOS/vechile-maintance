import { router } from 'expo-router';

export const POST_AUTH_ROUTES = {
  DASHBOARD: '/(tabs)',
  ADD_VEHICLE: '/vehicle/add',
  SIGN_IN: '/(auth)/login',
} as const;

/**
 * Returns the destination route based on whether the user has vehicles.
 * - vehicleCount >= 1 -> '/(tabs)' (Home Dashboard)
 * - vehicleCount === 0 -> '/vehicle/add' (Add Vehicle screen)
 */
export function getPostAuthRoute(vehicleCount: number): string {
  return vehicleCount > 0 ? POST_AUTH_ROUTES.DASHBOARD : POST_AUTH_ROUTES.ADD_VEHICLE;
}

/**
 * Navigates post-authentication using router.replace() to prevent
 * navigating back into previous auth or onboarding steps.
 */
export function navigatePostAuth(vehicleCount: number): string {
  const targetRoute = getPostAuthRoute(vehicleCount);
  router.replace(targetRoute as any);
  return targetRoute;
}
