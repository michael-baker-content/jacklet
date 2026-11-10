import { databaseEnabled, playerStatistics } from '../../../lib/blackjack/database';
import { playerFrom } from '../../../lib/blackjack/identity';
import { reportFailure } from '../../../lib/blackjack/diagnostics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
export async function GET(request: Request) {
  try {
    if (!databaseEnabled()) {
      if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview') return Response.json({ storage: 'browser' }, { headers });
      throw new Error('Statistics storage is not configured.');
    }
    const player = playerFrom(request);
    if (!player) return Response.json({ started: 0, completed: 0, cleared: 0, streak: 0, best: null, average: null, recent: [] }, { headers });
    return Response.json(await playerStatistics(player), { headers });
  } catch (error) {
    reportFailure('statistics.read', error);
    return Response.json({ error: 'Statistics are temporarily unavailable.' }, { status: 503, headers });
  }
}
