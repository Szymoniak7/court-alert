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

  // Warm only fast clubs (Playtomic + public kluby) — no auth, fully parallel, < 2s even on cold start.
  // Auth clubs (kluby-auth) warm on first user request via streaming.
  const fastClubs = CLUBS.filter((c) => c.source === 'playtomic' || c.source === 'kluby');
  const semaphore = makeSemaphore(20);
  const tasks = buildTasks([today], fastClubs, semaphore);

  const results = await Promise.allSettled(tasks.map((t) => t.promise));
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;

  return NextResponse.json({ ok: true, today, total: tasks.length, succeeded, failed });
}
