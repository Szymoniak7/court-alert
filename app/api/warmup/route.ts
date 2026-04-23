import { NextResponse } from 'next/server';
import { CLUBS } from '@/lib/clubs';
import { makeSemaphore, buildTasks } from '@/lib/fetchClubSlots';

export const dynamic = 'force-dynamic';

// Called by cron-job.org every 5 minutes.
// Pre-populates the per-club-per-date Redis slot cache for today + tomorrow.
export async function GET() {
  const toDate = (offset: number) =>
    new Date(Date.now() + offset * 86_400_000).toLocaleDateString('en-CA', {
      timeZone: 'Europe/Warsaw',
    });

  const dates = [toDate(0), toDate(1)];
  const semaphore = makeSemaphore(8);
  const tasks = buildTasks(dates, CLUBS, semaphore);

  const results = await Promise.allSettled(tasks.map((t) => t.promise));
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;

  return NextResponse.json({ ok: true, dates, total: results.length, succeeded, failed });
}
