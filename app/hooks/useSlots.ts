'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeSlot } from '@/lib/types';
import { getDates } from '@/lib/presets';

interface Params {
  selectedDay: string;
  selectedClubs: string[];
  fromHour: number;
  toHour: number;
}

function sortSlots(slots: TimeSlot[]): TimeSlot[] {
  return [...slots].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.clubName.localeCompare(b.clubName)
  );
}

export function useSlots({ selectedDay, selectedClubs, fromHour, toHour }: Params) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // true after the first complete fetch — used to decide whether to dim grid on refresh
  const [hasEverLoaded, setHasEverLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const hasDataRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const fetchSlotsRef = useRef<() => void>(() => {});

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchSlots = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsRefreshing(true);
    setErrors([]);
    if (!hasDataRef.current) setLoading(true);

    try {
      const dates = getDates(selectedDay);
      const params = new URLSearchParams({
        dates: dates.join(','),
        from: String(fromHour),
        to: String(toHour),
        clubs: selectedClubs.join(','),
      });

      const res = await fetch(`/api/availability/stream?${params}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const accumulated: TimeSlot[] = [];

      // Throttle React renders: at most one re-sort/render per 150ms
      let lastRender = 0;
      let renderPending = false;
      function flushRender(force = false) {
        const now = Date.now();
        if (ctrl.signal.aborted) return;
        if (force || now - lastRender >= 150) {
          setSlots(sortSlots(accumulated));
          lastRender = now;
          renderPending = false;
        } else if (!renderPending) {
          renderPending = true;
          setTimeout(() => flushRender(true), 150 - (now - lastRender));
        }
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as {
              type: string;
              clubId?: string;
              slots?: TimeSlot[];
              name?: string;
            };

            if (event.type === 'slots' && event.slots) {
              accumulated.push(...event.slots);
              if (!ctrl.signal.aborted) {
                setLoading(false);
                hasDataRef.current = true;
                flushRender();
              }
            } else if (event.type === 'error' && event.name) {
              if (!ctrl.signal.aborted) {
                setErrors((prev) => [...prev, `Błąd pobierania: ${event.name}`]);
              }
            }
          } catch {
            // malformed line — skip
          }
        }
      }

      // Final flush — ensure the last batch of slots is always rendered
      flushRender(true);

      if (!ctrl.signal.aborted) {
        setLastUpdated(new Date());
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error(e);
        setErrors((prev) => (prev.length ? prev : ['Błąd połączenia z serwerem']));
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setHasEverLoaded(true);
    }
  }, [selectedDay, selectedClubs, fromHour, toHour]);

  // Always-current ref — auto-refresh timer calls this without resetting the interval
  fetchSlotsRef.current = fetchSlots;

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Auto-refresh every 3 minutes — stable timer, independent of filter changes
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) fetchSlotsRef.current();
    }, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const resetSlots = useCallback(() => {
    setSlots([]);
    hasDataRef.current = false;
  }, []);

  function getEmptyMessage(): { title: string; sub: string } {
    const nowH = new Date().getHours();
    if (selectedDay === 'today' && nowH >= toHour) {
      return { title: 'Wszystkie sloty na dziś już minęły', sub: 'Sprawdź jutro lub zmień przedział godzin.' };
    }
    if (selectedDay === 'today' && nowH >= fromHour) {
      return { title: 'Brak wolnych kortów', sub: 'Część slotów już minęła. Spróbuj innego przedziału.' };
    }
    return { title: 'Brak wolnych kortów', sub: 'w wybranym przedziale czasowym' };
  }

  function slotLabel(n: number) {
    if (n === 1) return '1 slot';
    if (n >= 2 && n <= 4) return `${n} sloty`;
    return `${n} slotów`;
  }

  return {
    slots,
    errors,
    loading,
    isRefreshing,
    hasEverLoaded,
    lastUpdated,
    now,
    fetchSlots,
    resetSlots,
    setErrors,
    getEmptyMessage,
    slotLabel,
  };
}
