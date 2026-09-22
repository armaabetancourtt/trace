import { haversineDistanceM, type Coordinate } from './geo';

export type InterceptCandidate = {
  point: Coordinate;
  routeIndex: number;
  runnerEtaSec: number;
  joinerEtaSec: number;
  waitSec: number;
  missSec: number;
};

/**
 * Estimates where a joining runner could meet an active session.
 *
 * This intentionally uses a transparent deterministic heuristic rather than
 * "AI": evaluate future route points and choose the point where both ETAs are
 * closest, preferring candidates the joiner can reach before the group.
 *
 * A production version should route the joining user along the pedestrian
 * network instead of using straight-line distance.
 */
export function estimateInterceptPoint(params: {
  joinerLocation: Coordinate;
  remainingRoute: Coordinate[];
  activeRunnerLocation?: Coordinate;
  runnerSpeedMps: number;
  joinerSpeedMps: number;
  maxLookaheadSec?: number;
}): InterceptCandidate | null {
  const {
    joinerLocation,
    remainingRoute,
    activeRunnerLocation = remainingRoute[0],
    runnerSpeedMps,
    joinerSpeedMps,
    maxLookaheadSec = 30 * 60,
  } = params;

  if (remainingRoute.length === 0 || runnerSpeedMps <= 0 || joinerSpeedMps <= 0) {
    return null;
  }

  let runnerDistanceM = haversineDistanceM(activeRunnerLocation, remainingRoute[0]);
  let best: InterceptCandidate | null = null;

  for (let index = 0; index < remainingRoute.length; index += 1) {
    if (index > 0) {
      runnerDistanceM += haversineDistanceM(
        remainingRoute[index - 1],
        remainingRoute[index],
      );
    }

    const point = remainingRoute[index];
    const runnerEtaSec = runnerDistanceM / runnerSpeedMps;
    if (runnerEtaSec > maxLookaheadSec) break;

    const joinerDistanceM = haversineDistanceM(joinerLocation, point);
    const joinerEtaSec = joinerDistanceM / joinerSpeedMps;

    const waitSec = Math.max(0, runnerEtaSec - joinerEtaSec);
    const missSec = Math.max(0, joinerEtaSec - runnerEtaSec);

    const candidate: InterceptCandidate = {
      point,
      routeIndex: index,
      runnerEtaSec,
      joinerEtaSec,
      waitSec,
      missSec,
    };

    if (!best) {
      best = candidate;
      continue;
    }

    // Being late is worse than arriving early and waiting.
    const candidatePenalty = candidate.missSec * 4 + candidate.waitSec;
    const bestPenalty = best.missSec * 4 + best.waitSec;

    if (candidatePenalty < bestPenalty) best = candidate;
  }

  return best;
}
