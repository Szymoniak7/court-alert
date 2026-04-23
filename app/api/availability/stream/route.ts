import { NextRequest } from 'next/server';
import { CLUBS } from '@/lib/clubs';
import { makeSemaphore, buildTasks } from '@/lib/fetchClubSlots';
import { TimeSlot } from '@/lib/types';

export const dynamic = 'force-dynamic';

function isInTimeRange(startTime: string, fromHour: number, toHour: number, date: string): boolean {
  const [h, m] = startTime.split(':').map(Number);
  if (h < fromHour || h >= toHour) return false;
  const now = new Date();
  const todayWarsaw = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
  if (date === todayWarsaw) {
    const [nowH, nowM] = now
      .toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Warsaw',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .split(':')
      .map(Number);
    if (h * 60 + m < nowH * 60 + nowM) return false;
  }
  return true;
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

  const semaphore = makeSemaphore(8);
  const tasks = buildTasks(dates, clubs, semaphore);
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      if (tasks.length === 0) {
        controller.enqueue(enc.encode(JSON.stringify({ type: 'done' }) + '\n'));
        controller.close();
        return;
      }

      let settled = 0;
      function settle() {
        settled++;
        if (settled === tasks.length) {
          controller.enqueue(enc.encode(JSON.stringify({ type: 'done' }) + '\n'));
          controller.close();
        }
      }

      for (const task of tasks) {
        task.promise
          .then((rawSlots: TimeSlot[]) => {
            const slots = rawSlots.filter((s) =>
              isInTimeRange(s.startTime, fromHour, toHour, s.date)
            );
            controller.enqueue(
              enc.encode(JSON.stringify({ type: 'slots', clubId: task.club.id, slots }) + '\n')
            );
          })
          .catch((err: unknown) => {
            console.error(`[stream] ${task.club.name} ${task.date}:`, err);
            controller.enqueue(
              enc.encode(
                JSON.stringify({ type: 'error', clubId: task.club.id, name: task.club.name }) + '\n'
              )
            );
          })
          .finally(settle);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',   // disable nginx proxy buffering (Vercel)
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
