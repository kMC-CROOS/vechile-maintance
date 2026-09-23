/**
 * Maps raw vehicle class or body type string to existing app categories:
 * - CAR
 * - BIKE
 * - THREE-WHEELER
 * - VAN / SUV
 * - BUS
 * - TRUCK
 * - HEAVY DUTY
 * - TRACTOR
 * 
 * Returns null if mapping is uncertain.
 */
export function mapVehicleCategory(
  vehicleClassText?: string | null,
  bodyTypeText?: string | null
): string | null {
  const combined = `${vehicleClassText || ''} ${bodyTypeText || ''}`.trim().toUpperCase();

  if (!combined) return null;

  // 1. BIKE
  if (
    combined.includes('MOTOR CYCLE') ||
    combined.includes('MOTORCYCLE') ||
    combined.includes('SCOOTER') ||
    combined.includes('SOLO') ||
    combined.includes('MOPED') ||
    combined.includes('TWO WHEELER')
  ) {
    return 'Bike';
  }

  // 2. THREE-WHEELER
  if (
    combined.includes('MOTOR TRICYCLE') ||
    combined.includes('THREE WHEELER') ||
    combined.includes('3 WHEELER') ||
    combined.includes('AUTO RICKSHAW') ||
    combined.includes('TRICYCLE') ||
    combined.includes('TRIKE')
  ) {
    return 'Three-Wheeler';
  }

  // 3. CAR
  if (
    combined.includes('MOTOR CAR') ||
    combined.includes('PASSENGER CAR') ||
    combined.includes('SALOON') ||
    combined.includes('SEDAN') ||
    combined.includes('HATCHBACK') ||
    combined.includes('COUPE') ||
    combined.includes('CABRIOLET')
  ) {
    return 'Car';
  }

  // 4. VAN / SUV
  if (
    combined.includes('DUAL PURPOSE') ||
    combined.includes('VAN') ||
    combined.includes('SUV') ||
    combined.includes('STATION WAGON') ||
    combined.includes('MINIBUS') ||
    combined.includes('MICROBUS') ||
    combined.includes('ESTATE')
  ) {
    return 'Van / SUV';
  }

  // 5. BUS
  if (
    combined.includes('OMNIBUS') ||
    combined.includes('PASSENGER BUS') ||
    combined.includes('INTERCITY BUS') ||
    combined.includes('COACH') ||
    combined.includes('SCHOOL BUS') ||
    combined.includes('BUS')
  ) {
    return 'Bus';
  }

  // 6. HEAVY DUTY
  if (
    combined.includes('TIPPER') ||
    combined.includes('HEAVY LORRY') ||
    combined.includes('TRAILER') ||
    combined.includes('PRIME MOVER') ||
    combined.includes('EXCAVATOR') ||
    combined.includes('DUMPER') ||
    combined.includes('CRANE') ||
    combined.includes('HEAVY EQUIPMENT')
  ) {
    return 'Heavy Duty';
  }

  // 7. TRUCK
  if (
    combined.includes('LORRY') ||
    combined.includes('TRUCK') ||
    combined.includes('LIGHT TRUCK') ||
    combined.includes('GOODS VEHICLE') ||
    combined.includes('FLATBED') ||
    combined.includes('OPEN BED') ||
    combined.includes('PICKUP')
  ) {
    return 'Truck';
  }

  // 8. TRACTOR
  if (
    combined.includes('AGRICULTURAL TRACTOR') ||
    combined.includes('TRACTOR') ||
    combined.includes('FARM TRACTOR') ||
    combined.includes('LAND MASTER')
  ) {
    return 'Tractor';
  }

  return null;
}
