import type { Metadata } from 'next';
import DailyDraw from './play';
export const metadata: Metadata = { title: 'Daily Draw — Jacklet', description: 'A daily poker run against the computer. One deck, wild jokers, three strikes.', openGraph: { title: 'Daily Draw — Jacklet', description: 'Beat the opponent. One deck, wild jokers, three strikes.', url: '/games/draw' } };
export default function DrawPage() { return <DailyDraw />; }
