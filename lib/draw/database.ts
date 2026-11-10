import { neon } from '@neondatabase/serverless';
import { storageEnvironment } from '../blackjack/identity';
import { DRAW_GENERATION } from './server';
import type { Move } from './engine';

function database() {
  const url = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!url) throw new Error('Database is not configured.');
  return neon(url, { fetchOptions: { cache: 'no-store', signal: AbortSignal.timeout(10000) } });
}
export async function loadDraw(player: string, date: string): Promise<Move[]> {
  const sql = database();
  const rows = await sql`SELECT moves FROM jacklet_draw_sessions WHERE environment = ${storageEnvironment()}
    AND generation = ${DRAW_GENERATION} AND player_id = ${player}::uuid AND puzzle_date = ${date}::date`;
  return rows.length ? rows[0].moves as Move[] : [];
}
export async function saveDraw(player: string, date: string, moves: Move[], completed: boolean): Promise<boolean> {
  const sql = database();
  const rows = await sql`INSERT INTO jacklet_draw_sessions (environment, generation, player_id, puzzle_date, moves, revision, completed_at)
    VALUES (${storageEnvironment()}, ${DRAW_GENERATION}, ${player}::uuid, ${date}::date,
      ${JSON.stringify(moves)}::jsonb, ${moves.length}, CASE WHEN ${completed} THEN now() ELSE NULL END)
    ON CONFLICT (environment, generation, player_id, puzzle_date) DO UPDATE SET
      moves = EXCLUDED.moves, revision = EXCLUDED.revision, completed_at = EXCLUDED.completed_at, updated_at = now()
    WHERE jacklet_draw_sessions.revision = EXCLUDED.revision - 1
      AND jacklet_draw_sessions.completed_at IS NULL
      AND jacklet_draw_sessions.moves = (EXCLUDED.moves - (EXCLUDED.revision - 1))
    RETURNING revision`;
  return rows.length === 1;
}
