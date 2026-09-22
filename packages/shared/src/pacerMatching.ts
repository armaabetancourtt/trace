export type PacerCandidate = {
  uid: string;
  distanceAwayM: number;
  averagePaceSecPerKm: number;
  recentPaceStdDevSec?: number;
  preferredDistanceM?: number;
};

export type PacerMatch = PacerCandidate & {
  score: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Explainable pacer ranking.
 *
 * Weights intentionally favor pace compatibility over proximity.
 * Later versions can replace these weights with a learned ranking model once
 * TRACE has enough consented data to evaluate it honestly.
 */
export function rankPacerCandidates(params: {
  targetPaceSecPerKm: number;
  targetDistanceM: number;
  candidates: PacerCandidate[];
}): PacerMatch[] {
  return params.candidates
    .map((candidate) => {
      const paceDelta = Math.abs(
        candidate.averagePaceSecPerKm - params.targetPaceSecPerKm,
      );

      const paceScore = clamp01(1 - paceDelta / 120);
      const proximityScore = clamp01(1 - candidate.distanceAwayM / 5000);

      const distanceScore =
        candidate.preferredDistanceM == null
          ? 0.5
          : clamp01(
              1 -
                Math.abs(candidate.preferredDistanceM - params.targetDistanceM) /
                  Math.max(params.targetDistanceM, 1000),
            );

      const consistencyScore =
        candidate.recentPaceStdDevSec == null
          ? 0.5
          : clamp01(1 - candidate.recentPaceStdDevSec / 90);

      const score = Math.round(
        (paceScore * 0.55 +
          proximityScore * 0.2 +
          distanceScore * 0.15 +
          consistencyScore * 0.1) *
          100,
      );

      return { ...candidate, score };
    })
    .sort((a, b) => b.score - a.score);
}
