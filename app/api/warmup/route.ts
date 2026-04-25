import { NextResponse } from 'next/server';
import { CLUBS } from '@/lib/clubs';
import { makeSemaphore, buildTasks } from '@/lib/fetchClubSlots';

export const dynamic = 'force-dynamic';

// Called by cron-job.org every 5 minutes.
// Warms Redis slot cache for today + tomorrow.
// Strategy: Playtomic (fast, parallel) → 2 dates; kluby-auth (slow, semaphored) → today only
export async function GET() {
  const toDate = (offset: number) =>
    new Date(Date.now() + offset * 86_400_000).toLocaleDateString('en-CA', {
      timeZone: 'Europe/Warsaw',
    });

  const today = toDate(0);

  // Strategy:
  // - Playtomic (26 clubs): parallel, ~500ms total
  // - Warszawa auth (8 clubs): shared session → single login + 8 scrapes ~1.5s
  // - Other city auth clubs: warm on first user request via streaming
  // Total: ~2s → well within Vercel 10s limit
  const playtomicAndPublic = CLUBS.filter((c) => c.source === 'playtomic' || c.source === 'kluby');
  const warsawAuth = CLUBS.filter((c) => c.source === 'kluby-auth' && c.city === 'Warszawa');
  const semaphore = makeSemaphore(8);
  const tasks = buildTasks([today], [...playtomicAndPublic, ...warsawAuth], semaphore);

  const results = await Promise.allSettled(tasks.map((t) => t.promise));
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;

  return NextResponse.json({ ok: true, today, total: tasks.length, succeeded, failed });
}
