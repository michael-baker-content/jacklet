import type { Metadata } from 'next';
import Blackjack from '../../blackjack-game';
export const metadata: Metadata = { title: 'Daily Blackjack — Jacklet', openGraph: { title: 'Daily Blackjack — Jacklet', url: '/games/blackjack' } };
export default function BlackjackPage() { return <Blackjack />; }
