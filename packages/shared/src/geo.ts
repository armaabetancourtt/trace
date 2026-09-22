export type Coordinate = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_M = 6_371_000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineDistanceM(a: Coordinate, b: Coordinate): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function metersPerSecondToPaceSecPerKm(speedMps: number): number | null {
  if (!Number.isFinite(speedMps) || speedMps <= 0) return null;
  return 1000 / speedMps;
}

export function paceSecPerKmToMetersPerSecond(paceSecPerKm: number): number {
  if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) {
    throw new Error('paceSecPerKm must be greater than zero');
  }
  return 1000 / paceSecPerKm;
}
