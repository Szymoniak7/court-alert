import { NextRequest, NextResponse } from 'next/server';
import { CLUBS } from '@/lib/clubs';
import { fetchKlubySlots, fetchKlubyAuthSlots } from '@/lib/scrapers/kluby';
import { fetchPlaytomicSlots } from '@/lib/scrapers/playtomic';
import { TimeSlot } from '@/lib/types';

export const dynamic = 'force-dynamic';

function isInTimeRange(startTime: string, fromHour: number, toHour: number): boolean {
  const [h] = startTime.split(':').map(Number);
  return h >= fromHour && h < toHour;
}

function deduplicate(slots: TimeSlot[]): TimeSlot[] {
  const seen = new Map<string, TimeSlot>();
  for (const slot of slots) {
    const key = `${slot.clubId}|${slot.courtId}|${slot.date}|${slot.startTime}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, slot);
    } else {
      const preferNew =
        (slot.duration === 90 && existing.duration !== 90) ||
        (slot.duration !== 90 && existing.duration !== 90 && slot.duration < existing.duration);
      if (preferNew) seen.set(key, slot);
    }
  }
  return Array.from(seen.values());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Support multiple dates: ?dates=2026-04-14,2026-04-15 OR ?date=2026-04-14
  const datesParam = searchParams.get('dates') || searchParams.get('date');
  const dates = datesParam
    ? datesParam.split(',').filter(Boolean)
    : [new Date().toISOString().slice(0, 10)];

  const fromHour = parseInt(searchParams.get('from') || '17');
  const toHour = parseInt(searchParams.get('to') || '22');
  const clubIds = searchParams.get('clubs')?.split(',').filter(Boolean);

  const clubs = clubIds ? CLUBS.filter((c) => clubIds.includes(c.id)) : CLUBS;

  // Fetch all dates × all clubs in parallel
  const tasks = dates.flatMap((date) =>
    clubs.map((club) => ({
      date,
      club,
      promise: club.source === 'kluby'
        ? fetchKlubySlots(club.id, club.name, club.klubySlug!, date)
        : club.source === 'kluby-auth'
        ? fetchKlubyAuthSlots(club.id, club.name, club.klubySlug!, date)
        : fetchPlaytomicSlots(club.id, club.name, club.playtomicTenantId!, date, club.playtomicSlug),
    }))
  );

  const results = await Promise.allSettled(tasks.map((t) => t.promise));

  const allSlots: TimeSlot[] = [];
  const errorSet = new Set<string>();

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allSlots.push(...result.value);
    } else {
      errorSet.add(tasks[i].club.name);
      console.error(`[api] Error ${tasks[i].club.name} ${tasks[i].date}:`, result.reason);
    }
  });

  const filtered = allSlots.filter((s) =>
    isInTimeRange(s.startTime, fromHour, toHour)
  );

  const deduped = deduplicate(filtered);

  // Sort by date, then time, then club
  deduped.sort((a, b) =>
    a.date.localeCompare(b.date) ||
    a.startTime.localeCompare(b.startTime) ||
    a.clubName.localeCompare(b.clubName)
  );

  const errors = Array.from(errorSet).map((name) => `Błąd pobierania: ${name}`);

  return NextResponse.json({ slots: deduped, errors, dates, fromHour, toHour });
}
