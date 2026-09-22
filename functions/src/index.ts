/**
 * Firebase Cloud Functions entrypoint scaffold.
 *
 * Trusted server responsibilities:
 * - finalize activities idempotently;
 * - accept/decline join requests;
 * - compute pacer candidate scores;
 * - notify users through FCM;
 * - clean stale realtime presence;
 * - compute post-run derived metrics.
 */

export type MatchCandidate = {
  uid: string;
  distanceM: number;
  averagePaceSecPerKm: number;
  compatibility: number;
};

export function scorePacerMatch(params: {
  targetPaceSecPerKm: number;
  candidatePaceSecPerKm: number;
  distanceM: number;
}) {
  const paceDelta = Math.abs(params.targetPaceSecPerKm - params.candidatePaceSecPerKm);
  const paceScore = Math.max(0, 1 - paceDelta / 180);
  const distanceScore = Math.max(0, 1 - params.distanceM / 5000);

  return Math.round((paceScore * 0.7 + distanceScore * 0.3) * 100);
}
