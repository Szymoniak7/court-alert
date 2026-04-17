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

export function useSlots({ selectedDay, selectedClubs, fromHour, toHour }: Params) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    if (!hasDataRef.current) setLoading(true);
    try {
      const dates = getDates(selectedDay);
      const params = new URLSearchParams({
        dates: dates.join(','),
        from: String(fromHour),
        to: String(toHour),
        clubs: selectedClubs.join(','),
      });
      const res = await fetch(`/api/availability?${params}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setErrors(data.errors || []);
      setLastUpdated(new Date());
      hasDataRef.current = true;
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error(e);
        setErrors((prev) => (prev.length ? prev : ['Błąd połączenia z serwerem']));
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
    lastUpdated,
    now,
    fetchSlots,
    resetSlots,
    setErrors,
    getEmptyMessage,
    slotLabel,
  };
}
