import type { Coordinate } from './geo';

/**
 * Returns an approximate location cell for public discovery.
 *
 * This is a UX/privacy primitive, not anonymization. Server-side policy,
 * short TTLs, minimum crowd thresholds and abuse controls are still required.
 */
export function coarsenCoordinate(
  coordinate: Coordinate,
  cellSizeM = 300,
): Coordinate {
  const latMetersPerDegree = 111_320;
  const lonMetersPerDegree =
    Math.max(1, Math.cos((coordinate.latitude * Math.PI) / 180)) * 111_320;

  const latStep = cellSizeM / latMetersPerDegree;
  const lonStep = cellSizeM / lonMetersPerDegree;

  return {
    latitude: Math.round(coordinate.latitude / latStep) * latStep,
    longitude: Math.round(coordinate.longitude / lonStep) * lonStep,
  };
}
