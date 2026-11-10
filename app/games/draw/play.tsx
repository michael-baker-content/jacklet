"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawView } from '../../../lib/draw/server';
import { HAND_NAMES, JOKER, type Move } from '../../../lib/draw/engine';
import { PROGRESS_VERSION, SOUND_KEY } from '../../../lib/blackjack/progress';
import { playSound, stopSound, unlockSound } from '../../sound';
import AnimatedScore from '../../animated-score';
import './draw.css';

const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const suits = ['♣','♦','♥','♠'];
const draftKey = `${PROGRESS_VERSION}:draw-v2:holds`;
function cardLabel(card: number | null) {
  return card === null ? 'Face-down card' : card === JOKER ? 'Joker' : `${ranks[card%13]} ${['clubs','diamonds','hearts','spades'][Math.floor(card/13)]}`;
}
function PlayingCard({ card }: { card: number | null }) {
  const [failed, setFailed] = useState(false);
  const suit = card === null || card === JOKER ? 0 : Math.floor(card / 13);
  const rank = card === null ? '♠' : card === JOKER ? 'Joker' : ranks[card % 13];
  const file = card === null ? 'B-1' : card === JOKER ? 'J-1' : `${['C','D','H','S'][suit]}-${rank}`;
  return <span className={`draw-card ${suit === 1 || suit === 2 ? 'red-card' : ''}`}>
    <span>{rank}<br />{card === JOKER ? '🤡' : suits[suit]}</span>
    {!failed && <img src={`/cards/${file}.svg`} alt="" onError={() => setFailed(true)} />}
  </span>;
}
export default function DailyDraw() {
  const [game, setGame] = useState<DrawView | null>(null);
  const [held, setHeld] = useState([true,true,true,true,true]);
  const [targeting, setTargeting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [manual, setManual] = useState('');
  const [sound, setSound] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [nativeShare, setNativeShare] = useState(false);
  const soundRef = useRef(false), working = useRef(false);
  const current = useRef<DrawView | null>(null);
  const deadline = useRef(0), lastLoad = useRef(0);
  const help = useRef<HTMLDialogElement>(null);
  const accept = useCallback((next: DrawView) => {
    if (current.current?.date !== next.date || current.current?.revision !== next.revision) {
      let selection = [true,true,true,true,true];
      try {
        const saved = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
        if (saved?.date === next.date && saved.revision === next.revision && Array.isArray(saved.held) && saved.held.length === 5 && saved.held.every((v: unknown) => typeof v === 'boolean')) selection = saved.held;
      } catch {}
      const sameHand = current.current?.date === next.date && current.current?.round === next.round && current.current?.phase === 'selecting' && next.phase === 'selecting';
      setHeld(previous => (sameHand ? previous : selection).map((keep, i) => next.hand[i] === JOKER || keep)); setTargeting(false); setManual(''); setNotice('');
    }
    current.current = next; setGame(next);
    deadline.current = Date.now() + Date.parse(next.resetsAt) - Date.parse(next.serverTime);
    setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
  }, []);
  const load = useCallback(async () => {
    if (working.current) return;
    working.current = true; setBusy(true); lastLoad.current = Date.now();
    try {
      const response = await fetch('/api/draw', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      accept(data); setError('');
    } catch { setError('Couldn’t load your hand. Try recovering it.'); }
    finally { working.current = false; setBusy(false); }
  }, [accept]);
  useEffect(() => {
    try { soundRef.current = localStorage.getItem(SOUND_KEY) === 'on'; setSound(soundRef.current); } catch {}
    setNativeShare(typeof navigator.share === 'function');
    void load();
    const visible = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', visible);
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (current.current && !remaining && Date.now() - lastLoad.current > 10000) void load();
    }, 1000);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [load]);
  useEffect(() => {
    if (!game || game.phase !== 'selecting') return;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ date: game.date, revision: game.revision, held })); } catch {}
  }, [game, held]);
  function toggleCard(index: number) {
    if (busy || error || !seconds || !game || game.phase !== 'selecting' || game.hand[index] === JOKER) return;
    if (targeting) { void play({ type: 'joker', position: index }); return; }
    const next = held.map((v, i) => i === index ? !v : v);
    setHeld(next);
  }
  async function play(move: Move) {
    if (working.current || !game || game.completed || error || !seconds) return;
    working.current = true; setBusy(true); setNotice('');
    if (soundRef.current) unlockSound();
    try {
      const response = await fetch('/api/draw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: game.date, token: game.token, move }) });
      const next: DrawView & { error?: string } = await response.json();
      if (!response.ok && response.status !== 409) throw new Error(next.error);
      accept(next); setError('');
      if (response.status === 409) setNotice('Your latest hand has been restored.');
      else if (soundRef.current && next.revision > game.revision) playSound(move.type === 'draw' ? next.outcome === 'win' ? 'win' : next.outcome === 'loss' ? 'lose' : 'push' : 'card');
    } catch { setError('Couldn’t confirm your draw. Recover your hand before trying again.'); }
    finally { working.current = false; setBusy(false); }
  }
  function toggleSound() {
    const next = !soundRef.current; soundRef.current = next; setSound(next);
    try { localStorage.setItem(SOUND_KEY, next ? 'on' : 'off'); } catch {}
    if (next) playSound('click'); else stopSound();
  }
  function resultText() { return game?.completed ? `♠ Jacklet · Daily Draw · ${game.date}\n${game.score} points\n${game.won} won · ${game.round} played · ${game.strikes}/3 strikes\n${window.location.origin}/games/draw` : ''; }
  async function copy() {
    const text = resultText(); if (!text) return;
    try { await navigator.clipboard.writeText(text); setNotice('Result copied.'); }
    catch { setManual(text); setNotice('Select and copy your result below.'); }
  }
  async function share() {
    try { await navigator.share({ text: resultText() }); }
    catch (err) { if (!(err instanceof DOMException && err.name === 'AbortError')) await copy(); }
  }
  const replacing = held.filter((v, i) => !v && game?.hand[i] !== JOKER).length;
  const selecting = game?.phase === 'selecting';
  const locked = busy || !!error || !seconds;
  const countdown = [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n => String(n).padStart(2,'0')).join(':');
  return <main className="shell">
    <header className="header"><a className="wordmark" href="/"><span className="logo" aria-hidden="true">♠</span><span className="brand-name">Jacklet<small>daily draw</small></span></a><div className="header-actions"><button className={`sound-button ${sound ? 'sound-on' : 'sound-off'}`} aria-label={sound ? 'Mute sounds' : 'Enable sounds'} aria-pressed={sound} onClick={toggleSound}>♪</button><button className="help-button" aria-label="How to play Daily Draw" onClick={() => help.current?.showModal()}>?</button></div></header>
    <div className="game draw-game">
      <a className="draw-back" href="/">All games</a>
      <div className="title-row"><div><h1>Daily Draw</h1><time dateTime={game?.date}>{game?.date ?? 'Today'}</time></div><div className="score"><AnimatedScore value={game?.score ?? 0} /><small>pts.</small></div></div>
      <section className="table" aria-label="Five-card draw" aria-busy={busy}>
        <div className="table-top"><span>{game?.round ?? 0} played · {game?.won ?? 0} won</span><span>{game?.strikes ?? 0} / 3 strikes</span></div>
        {game && game.round > 0 && <>
          <h2 className="draw-hand-title">Opponent {game.opponentResult && <small>· {game.opponentResult.name}</small>}</h2>
          <div className="draw-hand opponent-hand">{game.opponent.map((card, i) => <div key={`${game.round}-${i}-${card}`} role="img" aria-label={cardLabel(card)}><PlayingCard card={card} /></div>)}</div>
          <div className="hand-separator" />
          <h2 className="draw-hand-title">Your hand {game.result && <small>· {game.result.name}</small>}</h2>
          <div className="draw-hand">{game.hand.map((card, i) => <button key={`${game.round}-${i}-${card}`} className={`draw-choice ${selecting && (held[i] || card === JOKER) ? 'is-held' : ''}`} aria-label={`${cardLabel(card)}${selecting ? targeting ? ', replace with joker' : held[i] || card === JOKER ? ', keep' : ', replace' : ''}`} aria-pressed={selecting && !targeting ? held[i] || card === JOKER : undefined} disabled={locked || !selecting || card === JOKER} onClick={() => toggleCard(i)}><PlayingCard card={card} /><span className="draw-choice-label">{card === JOKER ? game.resolved[i] !== undefined ? cardLabel(game.resolved[i]) : 'Wild' : selecting ? targeting ? 'Choose' : held[i] ? 'Keep' : 'Replace' : ''}</span></button>)}</div>
        </>}
        <p className="table-message" role="status">{busy ? 'Loading…' : targeting ? 'Choose a card to replace with a joker.' : selecting ? 'Tap cards to keep or replace. Draw once per hand.' : game?.message || 'One deck. Three strikes. Beat the opponent.'}</p>
        {!game?.completed && <div className="table-actions">{selecting ? <button className="primary" disabled={locked || targeting} onClick={() => play({ type: 'draw', discards: held.flatMap((keep,i) => keep || game.hand[i] === JOKER ? [] : [i]) })}>{replacing ? `Draw ${replacing} ${replacing === 1 ? 'card' : 'cards'}` : 'Keep all five · Showdown'}</button> : <button className="primary" disabled={!game || locked} onClick={() => play({ type: 'deal' })}>{game?.phase === 'between' ? 'Next hand' : 'Deal'}</button>}</div>}
        {selecting && <button className="secondary draw-submit draw-joker" disabled={locked || (!targeting && !game.canBuyJoker)} onClick={() => setTargeting(v => !v)}>{targeting ? 'Cancel joker' : `🃏 Play joker · ${game.jokerPrice} pts.`}</button>}
        {game?.completed && <div className="draw-result"><h2>{game.score} points</h2><p>{game.won} won · {game.round} played</p><div className="table-actions"><button className="primary" onClick={copy}>Copy result</button>{nativeShare && <button className="secondary" onClick={share}>Share…</button>}</div></div>}
      </section>
      {error && <p className="error" role="alert">{error} <button className="text-button" disabled={busy} onClick={load}>Recover hand</button></p>}
      <p className="notice" role="status">{notice}</p>
      {manual && <label className="manual-share">Copy your result<textarea readOnly value={manual} onFocus={e => e.target.select()} /></label>}
      <details className="draw-rankings"><summary>Poker hand rankings</summary><ol>{[...HAND_NAMES].reverse().map(name => <li key={name}>{name}</li>)}</ol><p>Aces can be high or low in a straight. Suits have equal rank.</p></details>
      <footer className="footer"><p>Next hand in <strong>{game ? countdown : '—'}</strong> · Midnight Eastern</p></footer>
    </div>
    <dialog className="help-dialog" ref={help} aria-labelledby="draw-help"><div className="rules-heading"><h2 id="draw-help">Daily Draw</h2><button className="help-button" aria-label="Close rules" onClick={() => help.current?.close()}>×</button></div><ul><li>Beat the opponent: +100 points. Lose: −100 and a strike. Three strikes end your run. Ties continue.</li><li>Keep or replace up to five cards. You draw first, then the opponent. Both hands are revealed and compared.</li><li>Each ordinary card revealed earns 1 point. Hidden discards do not count.</li><li>Jokers cost 50, 100, 150 points… Choose a card to replace. Purchased jokers stay wild through the draw and form your best standard poker hand.</li><li>Ten cards are needed to start a hand. When replacements run out, unfilled positions keep their cards, then showdown.</li><li>One daily run. Resets midnight Eastern.</li></ul><button className="primary modal-start" onClick={() => help.current?.close()}>Got it</button></dialog>
  </main>;
}
