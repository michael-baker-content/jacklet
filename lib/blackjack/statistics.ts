import { previousDay } from './dates';

export type PlayerStatistics = {
  started: number; completed: number; cleared: number; streak: number;
  best: number | null; average: number | null;
  recent: { date: string; score: number; stars: number; handsPlayed: number; handsWon: number }[];
};

export function participationStreak(dates: string[], today: string) {
  const played = new Set(dates);
  let day = played.has(today) ? today : previousDay(today), streak = 0;
  while (played.has(day)) { streak++; day = previousDay(day); }
  return streak;
}
