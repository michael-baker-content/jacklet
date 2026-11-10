import { readFile } from 'node:fs/promises';
const catalog = JSON.parse(await readFile(new URL('../lib/blackjack/catalog.json', import.meta.url), 'utf8'));
const ratings = JSON.parse(await readFile(new URL('../lib/blackjack/ratings.json', import.meta.url), 'utf8'));
const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
const part = type => parts.find(p => p.type === type).value;
const today = `${part('year')}-${part('month')}-${part('day')}`;
const horizon = 30;
const missing = [];
for (let i = 0; i < horizon; i++) {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + i);
  const id = date.toISOString().slice(0, 10);
  if (!catalog[id] || !ratings[id]?.threeStrikes?.thresholds) missing.push(id);
}
if (missing.length) {
  console.error(`Schedule needs attention: ${missing.length} date(s) lack decks or ratings in the next ${horizon} days, starting ${missing[0]}. Append seeds, then generate ratings.`);
  process.exitCode = 1;
} else console.log(`Decks and ratings cover the next ${horizon} days through ${Object.keys(catalog).sort().at(-1)}.`);
