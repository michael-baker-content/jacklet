import { databaseEnabled } from '../../../lib/blackjack/database';
import { newPlayer, playerFrom, withPlayer } from '../../../lib/blackjack/identity';
import { reportFailure } from '../../../lib/blackjack/diagnostics';
import { validMove, replay, type Move } from '../../../lib/draw/engine';
import { loadDraw, saveDraw } from '../../../lib/draw/database';
import { cookieMoves, easternDay, resultResponse, verify, deckFor } from '../../../lib/draw/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function persistent() { return databaseEnabled() || (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview'); }
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  try {
    const now = new Date(), date = easternDay(now);
    if (!persistent()) return resultResponse(date, cookieMoves(request, date), 200, now);
    const player = playerFrom(request) ?? newPlayer();
    return withPlayer(resultResponse(date, await loadDraw(player, date), 200, now), player);
  } catch (err) { reportFailure('draw.load', err); return error('Daily Draw is temporarily unavailable. Try again shortly.', 503); }
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return error('Please play from the game page.', 403);
    const raw = await request.text();
    if (raw.length > 6000) return error('Request too large.', 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || !validMove(body.move)) return error('That action could not be read.', 400);
    const now = new Date(), date = easternDay(now), useDB = persistent();
    const player = useDB ? playerFrom(request) : null;
    if (useDB && !player) return withPlayer(resultResponse(date, [], 409, now), newPlayer());
    const respond = (moves: Move[], status = 200) => {
      const response = resultResponse(date, moves, status, now);
      return player ? withPlayer(response, player) : response;
    };
    const saved = useDB ? await loadDraw(player!, date) : cookieMoves(request, date);
    if (body.date !== date) return respond(saved, 409);
    const ticket = verify(body.token, date);
    if (!ticket) return respond(saved, 409);
    const latest = useDB || saved.length >= ticket.length ? saved : ticket;
    if (JSON.stringify(ticket) !== JSON.stringify(latest)) return respond(latest, 409);
    const moves = [...latest, body.move as Move];
    let completed: boolean;
    try { completed = replay(deckFor(date), moves).phase === 'finished'; }
    catch { return error('That action is no longer available. Recover your run.', 400); }
    if (useDB && !await saveDraw(player!, date, moves, completed)) return respond(await loadDraw(player!, date), 409);
    return respond(moves);
  } catch (err) {
    if (err instanceof SyntaxError) return error('That action could not be read.', 400);
    reportFailure('draw.action', err); return error('Couldn’t confirm your action. Recover your run before trying again.', 503);
  }
}
