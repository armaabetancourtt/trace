/** Privacy-preserving pace baseline used in TRACE Intelligence.
 * No GPS points, route refs, user IDs or health attributes are accepted here.
 * This is the prior-28-day baseline from the ML benchmark, NOT a trained
 * sklearn model or a clinical/training recommendation.
 */
export type RunSummary = {
  startedAtMs: number;
  activityType: 'run' | 'walk' | 'ride';
  distanceM: number;
  averagePaceSecPerKm: number | null;
};

export type PaceInsight = {
  status: 'ready' | 'insufficient_history';
  modelKind: 'prior_28d_pace_baseline';
  trainedModelDeployed: false;
  dataClassification: 'user_reported_activity_summaries';
  evidence: Array<{ id: string; text: string }>;
  prediction: {
    expectedPaceSecPerKm: number | null;
    actualPaceSecPerKm: number | null;
    deltaSecPerKm: number | null;
    historyCount: number;
    windowDays: 28;
  };
  summary: string;
  limitations: string[];
};

const MIN_PACE = 120;
const MAX_PACE = 1200;
const WINDOW_MS = 28 * 24 * 60 * 60 * 1000;

function validRun(run: RunSummary): boolean {
  return run.activityType === 'run'
    && Number.isFinite(run.startedAtMs)
    && Number.isFinite(run.distanceM)
    && run.distanceM >= 500
    && run.averagePaceSecPerKm != null
    && Number.isFinite(run.averagePaceSecPerKm)
    && run.averagePaceSecPerKm >= MIN_PACE
    && run.averagePaceSecPerKm <= MAX_PACE;
}

export function calculatePaceInsight(
  target: RunSummary,
  history: RunSummary[],
): PaceInsight {
  if (!validRun(target)) {
    throw new Error('A completed run with plausible summary metrics is required.');
  }
  const recent = history.filter((run) =>
    validRun(run)
    && run.startedAtMs < target.startedAtMs
    && run.startedAtMs >= target.startedAtMs - WINDOW_MS
  );
  const actual = Math.round(target.averagePaceSecPerKm!);
  const expected = recent.length >= 3
    ? Math.round(recent.reduce((sum, run) => sum + run.averagePaceSecPerKm!, 0) / recent.length)
    : null;
  const delta = expected == null ? null : actual - expected;
  const evidence = [
    { id: 'actual-pace', text: 'Recorded average pace: ' + actual + ' seconds per km.' },
    { id: 'history-count', text: 'Eligible earlier runs within 28 days: ' + recent.length + '.' },
  ];
  if (expected != null && delta != null) {
    evidence.push(
      { id: 'prior-baseline', text: 'Historical prior-28-day mean pace: ' + expected + ' seconds per km.' },
      { id: 'pace-delta', text: 'Actual minus baseline pace: ' + delta + ' seconds per km (negative means faster).' },
    );
  }
  return {
    status: expected == null ? 'insufficient_history' : 'ready',
    modelKind: 'prior_28d_pace_baseline',
    trainedModelDeployed: false,
    dataClassification: 'user_reported_activity_summaries',
    evidence,
    prediction: {
      expectedPaceSecPerKm: expected,
      actualPaceSecPerKm: actual,
      deltaSecPerKm: delta,
      historyCount: recent.length,
      windowDays: 28,
    },
    summary: expected == null
      ? 'Not enough prior runs to estimate a pace baseline. At least three eligible runs in the preceding 28 days are needed.'
      : 'Recorded pace: ' + actual + ' s/km. Previous 28-day mean: ' + expected
        + ' s/km. Difference: ' + (delta! > 0 ? '+' : '') + delta
        + ' s/km. This compares recorded summaries; it does not prescribe training.',
    limitations: [
      'Past observed pace is a simple baseline; no fitted ML model is deployed.',
      'Distances, pace and timestamps originate from user device recordings.',
      'Only earlier sessions enter the 28-day window; no future outcome leakage.',
      'No medical, injury, safety, or prescribed training conclusions.',
    ],
  };
}
