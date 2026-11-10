export const HAND_NAMES = ['High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush', 'Royal flush'] as const;
export type HandResult = { name: typeof HAND_NAMES[number]; category: number; tiebreak: number[] };

export function evaluate(cards: number[]): HandResult {
  if (cards.length !== 5 || new Set(cards).size !== 5 || cards.some(c => !Number.isInteger(c) || c < 0 || c > 51)) throw new Error('Expected five distinct cards.');
  const ranks = cards.map(c => c % 13 === 0 ? 14 : c % 13 + 1).sort((a, b) => b - a);
  const groups = [...new Set(ranks)].map(rank => ({ rank, count: ranks.filter(r => r === rank).length })).sort((a, b) => b.count - a.count || b.rank - a.rank);
  const flush = cards.every(c => Math.floor(c / 13) === Math.floor(cards[0] / 13));
  const wheel = ranks.join(',') === '14,5,4,3,2';
  const straight = groups.length === 5 && (ranks[0] - ranks[4] === 4 || wheel);
  const high = wheel ? 5 : ranks[0];
  let category = 0, tiebreak = ranks;
  if (straight && flush) { category = high === 14 ? 9 : 8; tiebreak = [high]; }
  else if (groups[0].count === 4) { category = 7; tiebreak = groups.map(g => g.rank); }
  else if (groups[0].count === 3 && groups[1].count === 2) { category = 6; tiebreak = groups.map(g => g.rank); }
  else if (flush) category = 5;
  else if (straight) { category = 4; tiebreak = [high]; }
  else if (groups[0].count === 3) { category = 3; tiebreak = groups.map(g => g.rank); }
  else if (groups[0].count === 2 && groups[1].count === 2) { category = 2; tiebreak = groups.map(g => g.rank); }
  else if (groups[0].count === 2) { category = 1; tiebreak = groups.map(g => g.rank); }
  return { name: HAND_NAMES[category], category, tiebreak };
}

export function validDiscards(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= 5 && new Set(value).size === value.length && value.every(i => Number.isInteger(i) && i >= 0 && i < 5);
}

// Replacement cards follow deck order, filling discarded positions left to right.
export function drawHand(deck: number[], discards: number[]) {
  if (!validDiscards(discards)) throw new Error('Invalid discards.');
  const hand = deck.slice(0, 5);
  [...discards].sort((a, b) => a - b).forEach((position, i) => { hand[position] = deck[5 + i]; });
  return hand;
}

export const JOKER = 52;
export type Move = { type: 'deal' } | { type: 'draw'; discards: number[] } | { type: 'joker'; position: number };
export type State = {
  phase: 'ready' | 'selecting' | 'between' | 'finished';
  player: number[]; opponent: number[]; next: number; round: number;
  won: number; strikes: number; jokers: number; revealed: number;
  outcome: 'win' | 'loss' | 'tie' | null; message: string;
};
export const initial = (): State => ({ phase: 'ready', player: [], opponent: [], next: 0, round: 0, won: 0, strikes: 0, jokers: 0, revealed: 0, outcome: null, message: '' });
export const jokerPrice = (state: State) => (state.jokers + 1) * 50;
export const points = (state: State) => state.won * 100 - state.strikes * 100 + state.revealed - 25 * state.jokers * (state.jokers + 1);
export const canBuyJoker = (state: State, deckLength = 52) => state.phase === 'selecting' && state.next < deckLength && points(state) >= jokerPrice(state) && state.player.some(c => c !== JOKER);
export function compare(a: HandResult, b: HandResult) {
  if (a.category !== b.category) return Math.sign(a.category - b.category);
  for (let i = 0; i < a.tiebreak.length; i++) if (a.tiebreak[i] !== b.tiebreak[i]) return Math.sign(a.tiebreak[i] - b.tiebreak[i]);
  return 0;
}

// Enumerate rank multisets, not every suit permutation. A flush is possible only
// when all natural cards share a suit and all five ranks are distinct.
export function bestHand(cards: number[]): { result: HandResult; resolved: number[] } {
  const positions = cards.flatMap((c, i) => c === JOKER ? [i] : []);
  if (!positions.length) return { result: evaluate(cards), resolved: [...cards] };
  const natural = cards.filter(c => c !== JOKER);
  if (cards.length !== 5 || new Set(natural).size !== natural.length || natural.some(c => !Number.isInteger(c) || c < 0 || c > 51)) throw new Error('Invalid wildcard hand.');
  let best: { result: HandResult; resolved: number[] } | null = null;
  function visit(ranks: number[], start: number) {
    if (ranks.length < positions.length) {
      for (let rank = start; rank < 13; rank++) visit([...ranks, rank], rank);
      return;
    }
    const allRanks = [...natural.map(c => c % 13), ...ranks];
    if (allRanks.some(rank => allRanks.filter(r => r === rank).length > 4)) return;
    const flushSuit = natural.length ? Math.floor(natural[0] / 13) : 0;
    const flush = natural.every(c => Math.floor(c / 13) === flushSuit) && new Set(allRanks).size === 5;
    const resolved = [...cards], used = new Set(natural);
    positions.forEach((position, i) => {
      const rank = ranks[i];
      let card = flush ? flushSuit * 13 + rank : rank;
      while (used.has(card)) card += 13;
      resolved[position] = card; used.add(card);
    });
    const result = evaluate(resolved);
    if (!best || compare(result, best.result) > 0) best = { result, resolved };
  }
  visit([], 0);
  if (!best) throw new Error('No wildcard resolution.');
  return best;
}

// Fixed strategy based exclusively on the opponent's own five cards.
export function opponentDiscards(hand: number[]) {
  if (evaluate(hand).category >= 4) return [];
  const ranks = hand.map(c => c % 13 === 0 ? 14 : c % 13 + 1);
  const grouped = ranks.map(rank => ranks.filter(r => r === rank).length);
  if (grouped.some(count => count > 1)) return grouped.flatMap((count, i) => count === 1 ? [i] : []);
  for (let suit = 0; suit < 4; suit++) {
    if (hand.filter(c => Math.floor(c / 13) === suit).length === 4) return hand.flatMap((c, i) => Math.floor(c / 13) !== suit ? [i] : []);
  }
  for (let high = 14; high >= 5; high--) {
    const target = high === 5 ? [14,2,3,4,5] : [high,high-1,high-2,high-3,high-4];
    if (ranks.filter(rank => target.includes(rank)).length === 4) return ranks.flatMap((rank, i) => target.includes(rank) ? [] : [i]);
  }
  const keep = ranks.map((rank, i) => ({rank,i})).sort((a,b) => b.rank-a.rank).slice(0,2).map(c => c.i);
  return ranks.flatMap((_, i) => keep.includes(i) ? [] : [i]);
}
export function validMove(value: unknown): value is Move {
  if (!value || typeof value !== 'object') return false;
  const move = value as Move;
  return move.type === 'deal' || (move.type === 'draw' && validDiscards(move.discards)) || (move.type === 'joker' && Number.isInteger(move.position) && move.position >= 0 && move.position < 5);
}
export function step(previous: State, move: Move, deck: number[]): State {
  if (!validMove(move) || previous.phase === 'finished') throw new Error('That action is unavailable.');
  const state = { ...previous, player: [...previous.player], opponent: [...previous.opponent] };
  if (move.type === 'deal') {
    if (!['ready', 'between'].includes(state.phase) || deck.length - state.next < 10) throw new Error('A new hand needs ten cards.');
    state.player = []; state.opponent = [];
    for (let i = 0; i < 5; i++) { state.player.push(deck[state.next++]); state.opponent.push(deck[state.next++]); }
    state.round++; state.revealed += 5; state.phase = 'selecting'; state.outcome = null; state.message = '';
    return state;
  }
  if (state.phase !== 'selecting') throw new Error('Deal a hand first.');
  if (move.type === 'joker') {
    if (!canBuyJoker(state, deck.length) || state.player[move.position] === JOKER) throw new Error('That joker is unavailable.');
    state.player[move.position] = JOKER; state.jokers++;
    return state;
  }
  if (move.discards.some(i => state.player[i] === JOKER)) throw new Error('Purchased jokers stay in your hand.');
  // Decide the opponent's holds before consuming any replacement cards.
  const opponentChoices = opponentDiscards(state.opponent);
  for (const i of [...move.discards].sort((a,b) => a-b)) {
    if (state.next >= deck.length) break;
    state.player[i] = deck[state.next++]; state.revealed++;
  }
  for (const i of opponentChoices) {
    if (state.next >= deck.length) break;
    state.opponent[i] = deck[state.next++];
  }
  state.revealed += 5; // Only the opponent's final five become visible.
  const comparison = compare(bestHand(state.player).result, evaluate(state.opponent));
  state.outcome = comparison > 0 ? 'win' : comparison < 0 ? 'loss' : 'tie';
  if (comparison > 0) state.won++;
  if (comparison < 0) state.strikes++;
  state.phase = state.strikes >= 3 || deck.length - state.next < 10 ? 'finished' : 'between';
  state.message = comparison > 0 ? 'You win the hand.' : comparison < 0 ? 'Opponent wins. One strike.' : 'Tie. No win or strike.';
  if (state.phase === 'finished') state.message += state.strikes >= 3 ? ' Three strikes — run over.' : ' Fewer than ten cards remain — run over.';
  return state;
}
export function replay(deck: number[], moves: Move[]) { return moves.reduce((state, move) => step(state, move, deck), initial()); }
