import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, drawHand, validDiscards, HAND_NAMES, bestHand, compare, JOKER, initial, step, replay, points, jokerPrice, opponentDiscards, type Move } from '../lib/draw/engine';
import { deckFor, viewFor, resultResponse, cookieMoves, DRAW_COOKIE, sign, verify } from '../lib/draw/server';
import { GET, POST } from '../app/api/draw/route';

const card = (rank: number, suit = 0) => suit * 13 + (rank === 14 ? 0 : rank - 1);
test('five-card draw recognizes every hand category in order', () => {
  const hands = [
    [card(14),card(11,1),card(9,2),card(7),card(3)],
    [card(14),card(14,1),card(9,2),card(7),card(3)],
    [card(14),card(14,1),card(9,2),card(9),card(3)],
    [card(14),card(14,1),card(14,2),card(7),card(3)],
    [card(9),card(8,1),card(7,2),card(6),card(5)],
    [card(14),card(11),card(9),card(7),card(3)],
    [card(14),card(14,1),card(14,2),card(7),card(7,1)],
    [card(14),card(14,1),card(14,2),card(14,3),card(3)],
    [card(9),card(8),card(7),card(6),card(5)],
    [card(14),card(13),card(12),card(11),card(10)]
  ];
  hands.forEach((hand, category) => {
    assert.equal(evaluate(hand).name, HAND_NAMES[category]);
    assert.equal(evaluate(hand).category, category);
    assert.deepEqual(evaluate([...hand].reverse()), evaluate(hand));
  });
});
test('aces are low only in the wheel; pairs and kickers break ties', () => {
  assert.deepEqual(evaluate([card(14),card(2,1),card(3),card(4),card(5)]).tiebreak, [5]);
  assert.equal(evaluate([card(12),card(13,1),card(14),card(2),card(3)]).category, 0);
  assert.deepEqual(evaluate([card(7),card(7,1),card(14),card(12,2),card(3)]).tiebreak, [7,14,12,3]);
  assert.deepEqual(evaluate([card(3),card(3,1),card(14),card(14,2),card(7)]).tiebreak, [14,3,7]);
  assert.throws(() => evaluate([0,0,1,2,3]));
  assert.throws(() => evaluate([0,1,2,3,52]));
});
test('discards are positions, unique, and replace left to right without reusing old cards', () => {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  assert.deepEqual(drawHand(deck, []), [0,1,2,3,4]);
  assert.deepEqual(drawHand(deck, [4,1]), [0,5,2,3,6]);
  assert.deepEqual(drawHand(deck, [0,1,2,3,4]), [5,6,7,8,9]);
  for (const invalid of [[1,1],[-1],[5],[1.5],['1'],null,{},[0,1,2,3,4,5]]) assert.equal(validDiscards(invalid), false);
});
const dealDeck = (player: number[], opponent: number[], tail: number[] = []) => player.flatMap((c,i) => [c,opponent[i]]).concat(tail);
test('wildcards resolve to the best standard hand without duplicate cards or five of a kind', () => {
  const royal = bestHand([card(14),card(13),card(12),JOKER,JOKER]);
  assert.equal(royal.result.name, 'Royal flush');
  assert.equal(new Set(royal.resolved).size, 5);
  assert.equal(bestHand([card(7),card(7,1),card(7,2),card(7,3),JOKER]).result.name, 'Four of a kind');
  const hand = [card(9),card(9,1),card(5,2),JOKER,JOKER];
  let oracle = evaluate([hand[0],hand[1],hand[2],0,1]);
  for(let a=0;a<52;a++) for(let b=a+1;b<52;b++) {
    if(hand.includes(a) || hand.includes(b)) continue;
    const result = evaluate([hand[0],hand[1],hand[2],a,b]);
    if(compare(result,oracle)>0) oracle=result;
  }
  assert.deepEqual(bestHand(hand).result, oracle);
  assert.equal(bestHand([JOKER,JOKER,JOKER,JOKER,JOKER]).result.name, 'Royal flush');
  const before = bestHand([card(14),card(13),card(12),JOKER,card(2,1)]);
  const after = bestHand([card(14),card(13),card(12),JOKER,card(11)]);
  assert.equal(before.result.name,'One pair');
  assert.equal(after.result.name,'Royal flush');
  assert.notEqual(before.resolved[3],after.resolved[3]);
});
test('opponent choices depend only on its own hand', () => {
  assert.deepEqual(opponentDiscards([card(7),card(7,1),card(14),card(5),card(3)]), [2,3,4]);
  assert.deepEqual(opponentDiscards([card(14),card(11),card(9),card(7),card(3)]), []);
  assert.deepEqual(opponentDiscards([card(14),card(11),card(9),card(7),card(3,1)]), [4]);
  assert.deepEqual(opponentDiscards([card(8),card(7,1),card(6,2),card(5),card(14)]), [4]);
});
test('alternating deal hides opponent cards; wins earn 100 plus revealed cards', () => {
  const player = [card(14),card(13),card(12),card(11),card(10)];
  const opponent = [card(9,1),card(8,1),card(7,1),card(6,1),card(5,1)];
  const deck = dealDeck(player,opponent);
  const dealt = step(initial(),{type:'deal'},deck);
  assert.deepEqual(dealt.player,player); assert.deepEqual(dealt.opponent,opponent);
  assert.equal(points(dealt),5);
  const final = step(dealt,{type:'draw',discards:[]},deck);
  assert.equal(final.won,1); assert.equal(final.phase,'finished'); assert.equal(points(final),110);
  assert.equal(step({...dealt,strikes:2},{type:'draw',discards:[]},deck).strikes,2);
  assert.throws(()=>step(final,{type:'deal'},deck));
  assert.throws(()=>step(initial(),{type:'deal'},deck.slice(0,9)));
});
test('player draws first; exhaustion retains unfilled cards and still settles', () => {
  const deck = dealDeck([0,2,4,6,8],[14,16,18,20,22],[25,26]);
  const dealt = step(initial(),{type:'deal'},deck);
  const final = step(dealt,{type:'draw',discards:[4,1,0]},deck);
  assert.deepEqual(final.player,[25,26,4,6,8]);
  assert.deepEqual(final.opponent,dealt.opponent);
  assert.equal(final.next,12); assert.equal(final.revealed,12);
  assert.equal(final.phase,'finished');
  const opponentDeck=dealDeck([0,2,4,6,8],[card(7),card(7,1),card(14,2),card(3),card(5)],[25]);
  const opponentStart=step(initial(),{type:'deal'},opponentDeck);
  const opponentEnd=step(opponentStart,{type:'draw',discards:[]},opponentDeck);
  assert.deepEqual(opponentEnd.opponent,[card(7),card(7,1),25,card(3),card(5)]);
  assert.equal(opponentEnd.revealed,10);
  assert.equal(opponentEnd.phase,'finished');
});
test('strikes persist, ties do not win, and a third loss ends a run', () => {
  const player=[0,2,4,6,8], opponent=[13,15,17,19,21];
  const tieDeck=dealDeck(player,opponent);
  const tie=step(step(initial(),{type:'deal'},tieDeck),{type:'draw',discards:[]},tieDeck);
  assert.equal(tie.outcome,'tie'); assert.equal(tie.won,0); assert.equal(tie.strikes,0);
  const losing=[card(2),card(4,1),card(6,2),card(8,3),card(10)];
  const winning=[card(14),card(13),card(12),card(11),card(10)];
  const round=dealDeck(losing,winning);
  const deck=[...round,...round,...round,...round];
  let state=initial();
  for(let i=0;i<3;i++) {
    state=step(state,{type:'deal'},deck);
    state=step(state,{type:'draw',discards:[]},deck);
    assert.equal(state.strikes,i+1);
  }
  assert.equal(state.phase,'finished'); assert.equal(points(state),-270);
});
test('joker costs rise across hands, purchases deduct immediately, and jokers stay held', () => {
  const deck=Array.from({length:52},(_,i)=>i);
  const state={...step(initial(),{type:'deal'},deck),won:3};
  const first=step(state,{type:'joker',position:0},deck);
  assert.equal(first.player[0],JOKER); assert.equal(first.next,state.next);
  assert.equal(first.revealed,state.revealed); assert.equal(points(first),points(state)-50);
  assert.equal(jokerPrice(first),100);
  const second=step(first,{type:'joker',position:1},deck);
  assert.equal(points(second),points(first)-100);
  assert.throws(()=>step(second,{type:'draw',discards:[0]},deck));
  assert.throws(()=>step(first,{type:'joker',position:0},deck));
  const settled=step(second,{type:'draw',discards:[]},deck);
  const next=step(settled,{type:'deal'},deck);
  assert.equal(jokerPrice(next),150);
  assert.throws(()=>step({...state,next:52},{type:'joker',position:0},deck));
  assert.throws(()=>step({...state,won:0},{type:'joker',position:0},deck));
});
test('daily views hide opponent, deck, and strategy until showdown; signed histories reject edits', () => {
  const date='2026-11-09',now=new Date('2026-11-09T12:00:00Z'),deck=deckFor(date);
  assert.deepEqual(deckFor(date),deck); assert.notDeepEqual(deckFor('2026-11-10'),deck);
  assert.equal(new Set(deck).size,52);
  const moves:Move[]=[{type:'deal'}];
  const view=viewFor(date,moves,now);
  assert.deepEqual(view.opponent,[null,null,null,null,null]);
  assert.equal(view.opponentResult,null); assert.equal('next' in view,false); assert.equal('deck' in view,false);
  assert.equal(view.resetsAt,'2026-11-10T05:00:00.000Z');
  assert.deepEqual(verify(view.token,date),moves);
  assert.equal(verify(view.token+'x',date),null); assert.equal(verify(view.token,'2026-11-10'),null);
  assert.equal(verify(sign(date,[{type:'draw',discards:[]}]),date),null);
  const response=resultResponse(date,moves,200,now);
  const cookie=response.headers.get('set-cookie')!.split(';')[0];
  assert.ok(cookie.startsWith(DRAW_COOKIE+'='));
  assert.deepEqual(cookieMoves(new Request('https://jacklet.test',{headers:{cookie}}),date),moves);
  const shown=viewFor(date,[...moves,{type:'draw',discards:[]}],now);
  assert.ok(shown.opponent.every(c=>c!==null)); assert.ok(shown.result); assert.ok(shown.opponentResult);
});
test('draw API validates actions, restores revisions, and rejects stale requests', async () => {
  const keys=['DATABASE_URL','DATABASE_URL_POOLED','NODE_ENV','VERCEL_ENV'] as const;
  const previous=keys.map(key=>process.env[key]);
  delete process.env.DATABASE_URL; delete process.env.DATABASE_URL_POOLED;
  Object.assign(process.env,{NODE_ENV:'development',VERCEL_ENV:'preview'});
  const url='https://jacklet.test/api/draw';
  const post=(body:unknown,cookie='',origin='https://jacklet.test')=>POST(new Request(url,{method:'POST',headers:{'Content-Type':'application/json',cookie,origin},body:JSON.stringify(body)}));
  try {
    const initialView=await(await GET(new Request(url))).json();
    const body={date:initialView.date,token:initialView.token,move:{type:'deal'}};
    assert.equal((await post({...body,move:{type:'draw',discards:[1,1]}})).status,400);
    assert.equal((await post(body,'','https://elsewhere.test')).status,403);
    assert.equal((await post({...body,date:'2000-01-01'})).status,409);
    const dealt=await post(body);
    assert.equal(dealt.status,200);
    const view=await dealt.json(), cookie=dealt.headers.get('set-cookie')!.split(';')[0];
    assert.equal(view.revision,1);
    assert.equal((await post(body,cookie)).status,409);
    const restored=await(await GET(new Request(url,{headers:{cookie}}))).json();
    assert.deepEqual(restored.hand,view.hand);
    const result=await post({date:view.date,token:view.token,move:{type:'draw',discards:[]}},cookie);
    assert.equal(result.status,200);
    const shown=await result.json(); assert.equal(shown.revision,2); assert.ok(shown.result);
  } finally {
    keys.forEach((key,i)=>previous[i]===undefined?Reflect.deleteProperty(process.env,key):Object.assign(process.env,{[key]:previous[i]}));
  }
});
