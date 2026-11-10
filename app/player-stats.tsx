"use client";
import { useEffect, useRef, useState } from 'react';
import type { PlayerStatistics } from '../lib/blackjack/statistics';
import type { History } from '../lib/blackjack/client';
import { isFinished, statistics } from '../lib/blackjack/client';

export default function PlayerStats({ history, date, revision }: { history: History; date: string; revision: number }) {
  const [data, setData] = useState<PlayerStatistics | null>(null);
  const [browserOnly, setBrowserOnly] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(false); setBrowserOnly(false);
    void fetch('/api/stats', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Statistics unavailable');
        const value = await response.json();
        if (controller.signal.aborted) return;
        if (value.storage === 'browser') setBrowserOnly(true);
        else setData(value);
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [date, revision, retry]);
  const local = statistics(history, date);
  const finished = Object.values(history).filter(isFinished).sort((a, b) => b.id.localeCompare(a.id));
  const stats: PlayerStatistics | null = browserOnly ? {
    started: local.played, completed: finished.length, cleared: local.cleared, streak: local.streak,
    best: finished.length ? Math.max(...finished.map(run => run.score)) : null,
    average: finished.length ? Math.round(finished.reduce((sum, run) => sum + run.score, 0) / finished.length * 10) / 10 : null,
    recent: finished.slice(0, 10).map(run => ({ date: run.id, score: run.score, stars: run.stars, handsPlayed: run.round, handsWon: run.handsWon }))
  } : data;
  return <>
    <section className="stats" aria-label="Your statistics">
      <div><strong>{stats?.started ?? '—'}</strong><span>Played</span></div>
      <div><strong>{stats?.cleared ?? '—'}</strong><span>Decks cleared</span></div>
      <div><strong>{stats?.streak ?? '—'}<small> days</small></strong><span>Play streak</span></div>
    </section>
    <button className="text-button" onClick={() => dialog.current?.showModal()}>Your results</button>
    {error && <p role="status">Statistics couldn’t load. <button className="text-button" onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
    <dialog className="help-dialog" ref={dialog} aria-labelledby="stats-title">
      <div className="rules-heading"><h2 id="stats-title">Your results</h2><button className="help-button" aria-label="Close results" onClick={() => dialog.current?.close()}>×</button></div>
      {stats ? <>
        <p>{stats.completed} completed · Best {stats.best ?? '—'} · Average {stats.average ?? '—'}</p>
        {browserOnly && <p>Saved in this browser only.</p>}
        {stats.recent.length ? <table className="recent-results"><caption>Recent completed runs</caption><thead><tr><th scope="col">Date</th><th scope="col">Points</th><th scope="col">Stars</th></tr></thead><tbody>{stats.recent.map(run => <tr key={run.date}><th scope="row">{run.date}</th><td>{run.score}</td><td>{run.stars} / 5</td></tr>)}</tbody></table> : <p>Finish a daily run to see your first result.</p>}
      </> : <p role="status">{error ? 'Statistics are temporarily unavailable.' : 'Loading results…'}</p>}
    </dialog>
  </>;
}
