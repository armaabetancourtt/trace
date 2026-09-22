import { haversineDistanceM, type Coordinate } from './geo';

export type ActivitySample = Coordinate & {
  timestamp: number;
  altitudeM?: number;
  accuracyM?: number;
};

export type KilometerSplit = {
  kilometer: number;
  elapsedSec: number;
  paceSecPerKm: number;
};

export type ActivityMetrics = {
  durationSec: number;
  distanceM: number;
  averagePaceSecPerKm: number | null;
  elevationGainM: number;
  splits: KilometerSplit[];
};

export function computeActivityMetrics(samples: ActivitySample[]): ActivityMetrics {
  if (samples.length < 2) {
    return {
      durationSec: 0,
      distanceM: 0,
      averagePaceSecPerKm: null,
      elevationGainM: 0,
      splits: [],
    };
  }

  let distanceM = 0;
  let elevationGainM = 0;
  let splitDistanceM = 0;
  let splitStartTimestamp = samples[0].timestamp;
  let nextKilometer = 1;
  const splits: KilometerSplit[] = [];

  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const current = samples[i];

    const segmentM = haversineDistanceM(previous, current);

    // Ignore obviously invalid GPS jumps for this portfolio implementation.
    const segmentSec = Math.max(0.001, (current.timestamp - previous.timestamp) / 1000);
    const segmentSpeedMps = segmentM / segmentSec;
    if (segmentSpeedMps > 15) continue;

    distanceM += segmentM;
    splitDistanceM += segmentM;

    if (
      previous.altitudeM != null &&
      current.altitudeM != null &&
      current.altitudeM - previous.altitudeM >= 2
    ) {
      elevationGainM += current.altitudeM - previous.altitudeM;
    }

    if (splitDistanceM >= 1000) {
      const elapsedSec = (current.timestamp - splitStartTimestamp) / 1000;
      splits.push({
        kilometer: nextKilometer,
        elapsedSec,
        paceSecPerKm: elapsedSec / (splitDistanceM / 1000),
      });

      nextKilometer += 1;
      splitDistanceM = 0;
      splitStartTimestamp = current.timestamp;
    }
  }

  const durationSec =
    Math.max(0, samples.at(-1)!.timestamp - samples[0].timestamp) / 1000;

  return {
    durationSec,
    distanceM,
    averagePaceSecPerKm:
      distanceM > 0 ? durationSec / (distanceM / 1000) : null,
    elevationGainM,
    splits,
  };
}
