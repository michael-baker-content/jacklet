import test from 'node:test';
import assert from 'node:assert/strict';
import { participationStreak } from '../lib/blackjack/statistics';

test('participation streak includes unfinished days, tolerates today not started, and stops at gaps', () => {
  assert.equal(participationStreak(['2026-11-09', '2026-11-08', '2026-11-06'], '2026-11-09'), 2);
  assert.equal(participationStreak(['2026-11-08', '2026-11-07'], '2026-11-09'), 2);
  assert.equal(participationStreak(['2026-11-07'], '2026-11-09'), 0);
  assert.equal(participationStreak([], '2026-11-09'), 0);
  assert.equal(participationStreak(['2027-01-01', '2026-12-31'], '2027-01-01'), 2);
});
