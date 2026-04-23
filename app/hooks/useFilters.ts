'use client';

import { useState } from 'react';
import { CLUBS } from '@/lib/clubs';
import { DAY_PRESET_IDS, TIME_PRESETS } from '@/lib/presets';

export function useFilters() {
  // selectedDay: preset ID ('today','next3','weekend') or specific date ('YYYY-MM-DD')
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    if (typeof window === 'undefined') return 'today';
    const saved = localStorage.getItem('ca_day');
    return saved && DAY_PRESET_IDS.includes(saved) ? saved : 'today';
  });

  // Time stored directly as hours — default: Po pracy 17–21
  const [fromHour, setFromHour] = useState<number>(() => {
    if (typeof window === 'undefined') return 17;
    return parseInt(localStorage.getItem('ca_from') || '17');
  });

  const [toHour, setToHour] = useState<number>(() => {
    if (typeof window === 'undefined') return 21;
    return parseInt(localStorage.getItem('ca_to') || '21');
  });

  const [selectedClubs, setSelectedClubs] = useState<string[]>(() => {
    if (typeof window === 'undefined') return CLUBS.map((c) => c.id);
    const saved = localStorage.getItem('ca_clubs');
    return saved ? JSON.parse(saved) : CLUBS.map((c) => c.id);
  });

  const handleDayChange = (id: string) => {
    setSelectedDay(id);
    // Only persist semantic presets — specific dates go stale
    if (DAY_PRESET_IDS.includes(id)) {
      localStorage.setItem('ca_day', id);
    }
  };

  const handleTimeChange = (from: number, to: number) => {
    setFromHour(from);
    setToHour(to);
    localStorage.setItem('ca_from', String(from));
    localStorage.setItem('ca_to', String(to));
  };

  // Which TIME_PRESETS entry matches current from/to (for highlight)
  const activeTimePreset =
    TIME_PRESETS.find((p) => p.fromHour === fromHour && p.toHour === toHour)?.id ?? null;

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
    fromHour,
    toHour,
    activeTimePreset,
    selectedClubs,
    handleDayChange,
    handleTimeChange,
    toggleClub,
    toggleAllClubs,
  };
}
