import { createHmac, timingSafeEqual } from 'node:crypto';
import { easternDay, nextReset } from '../blackjack/dates';
import { PROGRESS_VERSION } from '../blackjack/progress';
import { replay, bestHand, evaluate, points, jokerPrice, canBuyJoker, validMove, type Move } from './engine';

export const DRAW_GENERATION = `${PROGRESS_VERSION}:draw-v2`;
export const DRAW_COOKIE = 'jacklet-draw-v2';
function key() {
  const value = process.env.PUZZLE_SECRET || (process.env.NODE_ENV !== 'production' ? 'jacklet-local-draw' : '');
  if (!value) throw new Error('PUZZLE_SECRET is required.');
  return value;
}
function mac(text: string) { return createHmac('sha256', key()).update(`${DRAW_GENERATION}:${text}`).digest('hex'); }
export function deckFor(date: string) {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  let counter = 0;
  for (let i = 51; i > 0; i--) {
    const limit = Math.floor(0x100000000 / (i + 1)) * (i + 1);
    let value: number;
    do { value = parseInt(mac(`deck:${date}:${counter++}`).slice(0, 8), 16); } while (value >= limit);
    const j = value % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export function sign(date: string, moves: Move[]) {
  const payload = Buffer.from(JSON.stringify({ date, moves })).toString('base64url');
  return `${payload}.${mac(`progress:${payload}`)}`;
}
export function verify(token: unknown, date: string): Move[] | null {
  if (typeof token !== 'string' || token.length > 3500) return null;
  const [payload, signature, extra] = token.split('.');
  if (!signature || extra) return null;
  const expected = Buffer.from(mac(`progress:${payload}`)), actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (value.date !== date || !Array.isArray(value.moves) || value.moves.length > 32 || !value.moves.every(validMove)) return null;
    replay(deckFor(date), value.moves);
    return value.moves as Move[];
  } catch { return null; }
}
export function cookieMoves(request: Request, date: string): Move[] {
  const value = request.headers.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith(`${DRAW_COOKIE}=`))?.slice(DRAW_COOKIE.length + 1);
  return verify(value, date) ?? [];
}
export function viewFor(date: string, moves: Move[], now = new Date()) {
  const state = replay(deckFor(date), moves);
  const revealed = state.phase === 'between' || state.phase === 'finished';
  const best = state.player.length ? bestHand(state.player) : null;
  return {
    date, resetsAt: nextReset(now).toISOString(), serverTime: now.toISOString(),
    token: sign(date, moves), revision: moves.length, phase: state.phase,
    hand: state.player, opponent: state.opponent.map(card => revealed ? card : null),
    completed: state.phase === 'finished', round: state.round, won: state.won,
    strikes: state.strikes, score: points(state), jokers: state.jokers,
    jokerPrice: jokerPrice(state), canBuyJoker: canBuyJoker(state),
    result: revealed ? best?.result ?? null : null,
    opponentResult: revealed ? evaluate(state.opponent) : null,
    resolved: revealed ? best?.resolved ?? [] : [],
    outcome: state.outcome, message: state.message
  };
}
export type DrawView = ReturnType<typeof viewFor>;
export function resultResponse(date: string, moves: Move[], status = 200, now = new Date()) {
  return Response.json(viewFor(date, moves, now), { status, headers: {
    'Cache-Control': 'no-store',
    'Set-Cookie': `${DRAW_COOKIE}=${sign(date, moves)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=172800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  } });
}
export { easternDay };
