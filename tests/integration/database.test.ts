import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

test('PostgreSQL commits one competing action, recovers lost responses, and locks completed results', async () => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url, 'Set TEST_DATABASE_URL to a separate test database with db/schema.sql applied.');
  // Ignore ordinary application connection settings; isolate every test invocation.
  process.env.DATABASE_URL = url;
  process.env.DATABASE_URL_POOLED = url;
  process.env.VERCEL_ENV = `integration-${randomUUID()}`;
  process.env.PUZZLE_SECRET = randomUUID();
  const store = await import('../../lib/blackjack/database');
  const { loadPersistent, playPersistent } = await import('../../lib/blackjack/persistence');
  const { playerToken, PLAYER_COOKIE } = await import('../../lib/blackjack/identity');
  const { isFinished } = await import('../../lib/blackjack/client');
  const player = randomUUID();
  const request = new Request('https://jacklet.test/api/blackjack', { headers: { cookie: `${PLAYER_COOKIE}=${playerToken(player)}` } });
  const now = new Date('2026-09-11T12:00:00Z');
  const sql = neon(url);
  try {
    const initial = await (await loadPersistent(request, now, store)).json();
    assert.equal((await store.playerStatistics(player)).started, 0);
    const body = { id: initial.id, token: initial.run.token, action: 'deal' };
    const results = await Promise.all([playPersistent(request, body, now, store), playPersistent(request, body, now, store)]);
    assert.deepEqual(results.map(response => response.status).sort(), [200, 409]);
    // Ignore both response bodies: simulate the client losing its accepted response.
    let daily = await (await loadPersistent(request, now, store)).json();
    assert.equal(daily.run.revision, 1);
    assert.equal((await playPersistent(request, body, now, store)).status, 409);
    for (let i = 0; i < 104 && !isFinished(daily.run); i++) {
      const response = await playPersistent(request, { id: daily.id, token: daily.run.token, action: daily.run.phase === 'player' ? 'stand' : 'deal' }, now, store);
      assert.equal(response.status, 200);
      daily = await response.json();
    }
    assert.ok(isFinished(daily.run));
    assert.equal((await playPersistent(request, body, now, store)).status, 409);
    assert.equal((await playPersistent(request, { id: daily.id, token: daily.run.token, action: 'deal' }, now, store)).status, 400);
    assert.deepEqual((await (await loadPersistent(request, now, store)).json()).run, daily.run);
    const stats = await store.playerStatistics(player);
    assert.equal(stats.started, 1);
    assert.equal(stats.completed, 1);
    assert.equal(stats.best, daily.run.score);
    assert.equal(stats.recent[0].score, daily.run.score);
    assert.equal((await store.playerStatistics(randomUUID())).started, 0);
  } finally {
    // Delete only this invocation's isolated synthetic player record.
    await sql`DELETE FROM jacklet_runs WHERE environment = ${process.env.VERCEL_ENV} AND player_id = ${player}::uuid`;
  }
});
