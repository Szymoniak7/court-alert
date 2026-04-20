import { NextRequest, NextResponse } from 'next/server';
import { CLUBS } from '@/lib/clubs';
import { fetchKlubySlots, fetchKlubyAuthSlots } from '@/lib/scrapers/kluby';
import { fetchPlaytomicSlots } from '@/lib/scrapers/playtomic';
import { TimeSlot } from '@/lib/types';
import { createClient } from 'redis';

export const dynamic = 'force-dynamic';

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 2000 },
    });
    redisClient.on('error', () => { redisClient = null; });
    await redisClient.connect();
  }
  return redisClient;
}

function isInTimeRange(startTime: string, fromHour: number, toHour: number, date: string): boolean {
  const [h, m] = startTime.split(':').map(Number);
  if (h < fromHour || h >= toHour) return false;

  // For today: hide slots that have already started (Warsaw time)
  const now = new Date();
  const todayWarsaw = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
  if (date === todayWarsaw) {
    const [nowH, nowM] = now
      .toLocaleTimeString('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hour12: false })
      .split(':').map(Number);
    if (h * 60 + m < nowH * 60 + nowM) return false;
  }

  return true;
}

function deduplicate(slots: TimeSlot[]): TimeSlot[] {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = `${slot.clubId}|${slot.courtId}|${slot.date}|${slot.startTime}|${slot.duration}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const datesParam = searchParams.get('dates') || searchParams.get('date');
  const dates = datesParam
    ? datesParam.split(',').filter(Boolean)
    : [new Date().toISOString().slice(0, 10)];

  const fromHour = parseInt(searchParams.get('from') || '17');
  const toHour = parseInt(searchParams.get('to') || '22');
  const clubIds = searchParams.get('clubs')?.split(',').filter(Boolean);
  const clubs = clubIds ? CLUBS.filter((c) => clubIds.includes(c.id)) : CLUBS;

  // Cache key — sorted so order doesn't matter
  const cacheKey = `availability:v1:${[...dates].sort().join(',')}:${fromHour}:${toHour}:${
    [...clubs.map((c) => c.id)].sort().join(',')
  }`;

  // Try cache first (2 min TTL)
  try {
    const redis = await getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return new NextResponse(cached, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }
  } catch (_) { /* Redis unavailable — skip cache */ }

  // Fetch all dates × all clubs in parallel
  const tasks = dates.flatMap((date) =>
    clubs.map((club) => ({
      date,
      club,
      promise: club.source === 'kluby'
        ? fetchKlubySlots(club.id, club.name, club.klubySlug!, date, club.defaultCourtType)
        : club.source === 'kluby-auth'
        ? fetchKlubyAuthSlots(club.id, club.name, club.klubySlug!, date, club.defaultCourtType)
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
    isInTimeRange(s.startTime, fromHour, toHour, s.date)
  );

  const deduped = deduplicate(filtered);

  deduped.sort((a, b) =>
    a.date.localeCompare(b.date) ||
    a.startTime.localeCompare(b.startTime) ||
    a.clubName.localeCompare(b.clubName)
  );

  const errors = Array.from(errorSet).map((name) => `Błąd pobierania: ${name}`);
  const body = JSON.stringify({ slots: deduped, errors, dates, fromHour, toHour });

  // Store in cache — only if no errors (don't cache partial results)
  if (errorSet.size === 0) {
    try {
      const redis = await getRedis();
      await redis.set(cacheKey, body, { EX: 120 }); // 2 min TTL
    } catch (_) { /* Redis unavailable — skip caching */ }
  }

  return new NextResponse(body, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
  });
}
