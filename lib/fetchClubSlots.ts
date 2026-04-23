import { Club } from './clubs';
import { fetchKlubySlots, fetchKlubyAuthSlots } from './scrapers/kluby';
import { fetchPlaytomicSlots } from './scrapers/playtomic';
import { TimeSlot } from './types';

export type SemaphoreFn = <T>(fn: () => Promise<T>) => Promise<T>;

export function makeSemaphore(limit: number): SemaphoreFn {
  let active = 0;
  const queue: (() => void)[] = [];
  return async function <T>(fn: () => Promise<T>): Promise<T> {
    if (active >= limit) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

export type ClubTask = {
  date: string;
  club: Club;
  promise: Promise<TimeSlot[]>;
};

export function buildTasks(
  dates: string[],
  clubs: Club[],
  semaphore: SemaphoreFn,
): ClubTask[] {
  return dates.flatMap((date) =>
    clubs.map((club) => ({
      date,
      club,
      promise:
        club.source === 'kluby'
          ? semaphore(() => fetchKlubySlots(club.id, club.name, club.klubySlug!, date, club.defaultCourtType))
          : club.source === 'kluby-auth'
          ? semaphore(() => fetchKlubyAuthSlots(club.id, club.name, club.klubySlug!, date, club.defaultCourtType))
          : fetchPlaytomicSlots(club.id, club.name, club.playtomicTenantId!, date, club.playtomicSlug),
    }))
  );
}
