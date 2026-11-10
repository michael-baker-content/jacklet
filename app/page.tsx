export default function Home() {
  return <main className="shell">
    <header className="header"><a className="wordmark" href="/"><span className="logo" aria-hidden="true">♠</span><span className="brand-name">Jacklet<small>the card room</small></span></a></header>
    <div className="game lobby">
      <h1>Pick your game.</h1>
      <p className="intro">A fresh challenge, every day. Make your cards count.</p>
      <nav className="game-picker" aria-label="Card games">
        <a href="/games/blackjack"><span aria-hidden="true">♠</span><h2>Daily Blackjack</h2><p>One deck. Three strikes. Spend points on jokers and see how far you get.</p><strong>Play Blackjack →</strong></a>
        <a href="/games/draw"><span aria-hidden="true">♦</span><h2>Daily Draw</h2><p>Beat the opponent. Buy wild jokers. Play through one deck before three strikes.</p><strong>Play Daily Draw →</strong></a>
      </nav>
      <p className="notice">Both challenges reset at midnight Eastern. Your progress saves in this browser.</p>
    </div>
  </main>;
}
