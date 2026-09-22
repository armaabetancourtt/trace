import type { PendingActivity } from '../activity/storage/ActivityStore';

type CompactPoint = [
  latitudeE5: number,
  longitudeE5: number,
  deltaMs: number,
  altitudeDm?: number,
];

export type RouteArtifactV1 = {
  version: 1;
  startedAt: number;
  points: CompactPoint[];
};

export function createRouteArtifact(
  activity: PendingActivity,
): RouteArtifactV1 {
  return {
    version: 1,
    startedAt: activity.startedAt,
    points: activity.samples.map((sample) => {
      const point: CompactPoint = [
        Math.round(sample.latitude * 100_000),
        Math.round(sample.longitude * 100_000),
        Math.max(0, Math.round(sample.timestamp - activity.startedAt)),
      ];

      if (sample.altitudeM != null) {
        point.push(Math.round(sample.altitudeM * 10));
      }

      return point;
    }),
  };
}
