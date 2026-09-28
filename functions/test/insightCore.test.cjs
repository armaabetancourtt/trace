const test = require('node:test');
const assert = require('node:assert/strict');
const { calculatePaceInsight } = require('../lib/insightCore.js');

const DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 8, 28);
const run = (daysAgo, pace, activityType = 'run') => ({
  startedAtMs: START - daysAgo * DAY,
  activityType, distanceM: 5000, averagePaceSecPerKm: pace,
});
const target = run(0, 300);

test('only earlier eligible summaries enter the prediction baseline', () => {
  const history = [run(2, 320), run(7, 340), run(20, 330), run(-1, 1000), run(35, 200), run(1, 100, 'walk')];
  const result = calculatePaceInsight(target, history);
  assert.equal(result.status, 'ready');
  assert.equal(result.prediction.historyCount, 3);
  assert.equal(result.prediction.expectedPaceSecPerKm, 330);
  assert.equal(result.prediction.deltaSecPerKm, -30);
  assert.equal(result.trainedModelDeployed, false);
  assert.equal(result.evidence.some((e) => /GPS|latitude|longitude/.test(e.text)), false);
});

test('insufficient history avoids fabricated prediction', () => {
  const result = calculatePaceInsight(target, [run(1, 320), run(2, 330)]);
  assert.equal(result.status, 'insufficient_history');
  assert.equal(result.prediction.expectedPaceSecPerKm, null);
  assert.equal(result.prediction.deltaSecPerKm, null);
});

test('invalid run summary does not produce an insight', () => {
  assert.throws(() => calculatePaceInsight(run(0, 0), []), /completed run/);
});
