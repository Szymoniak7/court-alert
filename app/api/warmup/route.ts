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
  const tomorrow = toDate(1);

  const playtomicClubs = CLUBS.filter((c) => c.source === 'playtomic');
  const klubyClubs = CLUBS.filter((c) => c.source === 'kluby' || c.source === 'kluby-auth');

  const semaphore = makeSemaphore(12);

  const tasks = [
    // Playtomic — 2 dates, fully parallel (no semaphore needed, different domains)
    ...buildTasks([today, tomorrow], playtomicClubs, semaphore),
    // kluby.org — today only (rate limit protection, tomorrow warms on first user request)
    ...buildTasks([today], klubyClubs, semaphore),
  ];

  const results = await Promise.allSettled(tasks.map((t) => t.promise));
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;

  return NextResponse.json({ ok: true, today, tomorrow, total: results.length, succeeded, failed });
}
