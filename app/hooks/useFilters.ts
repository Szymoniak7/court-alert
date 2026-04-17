'use client';

import { useState } from 'react';
import { CLUBS } from '@/lib/clubs';
import { DAY_OPTIONS, TIME_OPTIONS } from '@/lib/presets';

const VALID_DAY_IDS = DAY_OPTIONS.map((d) => d.id);

export function useFilters() {
  const [selectedDay, setSelectedDay] = useState(() => {
    if (typeof window === 'undefined') return 'weekdays';
    const saved = localStorage.getItem('ca_day');
    return saved && VALID_DAY_IDS.includes(saved) ? saved : 'weekdays';
  });

  const [selectedTimes, setSelectedTimes] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['afterwork'];
    const saved = localStorage.getItem('ca_times');
    return saved ? JSON.parse(saved) : ['afterwork'];
  });

  const [selectedClubs, setSelectedClubs] = useState<string[]>(() => {
    if (typeof window === 'undefined') return CLUBS.map((c) => c.id);
    const saved = localStorage.getItem('ca_clubs');
    return saved ? JSON.parse(saved) : CLUBS.map((c) => c.id);
  });

  const activeTimes = TIME_OPTIONS.filter((t) => selectedTimes.includes(t.id));
  const fromHour = activeTimes.length ? Math.min(...activeTimes.map((t) => t.fromHour)) : 0;
  const toHour   = activeTimes.length ? Math.max(...activeTimes.map((t) => t.toHour))   : 24;

  const handleDayChange = (id: string) => {
    setSelectedDay(id);
    localStorage.setItem('ca_day', id);
  };

  const toggleTime = (id: string) => {
    setSelectedTimes((prev) => {
      const next = prev.includes(id)
        ? prev.length > 1 ? prev.filter((t) => t !== id) : prev
        : [...prev, id];
      localStorage.setItem('ca_times', JSON.stringify(next));
      return next;
    });
  };

  const toggleClub = (id: string) => {
    setSelectedClubs((prev) => {
      const next = prev.includes(id)
        ? prev.length > 1 ? prev.filter((c) => c !== id) : prev
        : [...prev, id];
      localStorage.setItem('ca_clubs', JSON.stringify(next));
      return next;
    });
  };

  const toggleAllClubs = () => {
    const allIds = CLUBS.map((c) => c.id);
    const next = selectedClubs.length === CLUBS.length ? [CLUBS[0].id] : allIds;
    setSelectedClubs(next);
    localStorage.setItem('ca_clubs', JSON.stringify(next));
  };

  return {
    selectedDay,
    selectedTimes,
    selectedClubs,
    fromHour,
    toHour,
    handleDayChange,
    toggleTime,
    toggleClub,
    toggleAllClubs,
  };
}
