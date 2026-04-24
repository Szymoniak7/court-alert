'use client';

import { useState, useMemo, useEffect } from 'react';
import { CLUBS } from '@/lib/clubs';
import { DAY_PRESET_IDS, TIME_PRESETS } from '@/lib/presets';

// Preferred display order — new cities appended automatically at the end
const CITY_ORDER = [
  'Warszawa',
  'Wrocław',
  'Katowice', 'Gliwice', 'Chorzów', 'Bytom', 'Zabrze', 'Tychy', 'Dąbrowa Górnicza', 'Pszczyna',
  'Opole',
];

// City center coords for geolocation detection [lat, lng]
const CITY_COORDS: Record<string, [number, number]> = {
  'Warszawa':          [52.23, 21.01],
  'Wrocław':           [51.11, 17.04],
  'Katowice':          [50.26, 19.02],
  'Gliwice':           [50.29, 18.67],
  'Chorzów':           [50.30, 18.95],
  'Bytom':             [50.35, 18.91],
  'Zabrze':            [50.32, 18.79],
  'Tychy':             [50.14, 18.98],
  'Dąbrowa Górnicza':  [50.32, 19.18],
  'Pszczyna':          [49.98, 18.95],
  'Opole':             [50.68, 17.92],
};

function detectCity(lat: number, lng: number): string | null {
  let nearest: string | null = null;
  let minDist = Infinity;
  for (const [city, [clat, clng]] of Object.entries(CITY_COORDS)) {
    const d = Math.sqrt((lat - clat) ** 2 + (lng - clng) ** 2);
    if (d < minDist) { minDist = d; nearest = city; }
  }
  return minDist < 0.6 ? nearest : null; // ~60km radius
}

export function useFilters() {
  // ── City ──────────────────────────────────────────────────────────────────
  const initialCity = (() => {
    if (typeof window === 'undefined') return 'Warszawa';
    return localStorage.getItem('ca_city') || 'Warszawa';
  })();

  const [selectedCity, setSelectedCityState] = useState<string>(initialCity);

  const clubsForCity = useMemo(
    () => CLUBS.filter((c) => c.city === selectedCity),
    [selectedCity],
  );

  const cities = useMemo(() => {
    const all = [...new Set(CLUBS.map((c) => c.city).filter(Boolean) as string[])];
    return CITY_ORDER.filter((c) => all.includes(c)).concat(all.filter((c) => !CITY_ORDER.includes(c)));
  }, []);

  const setCity = (city: string) => {
    setSelectedCityState(city);
    localStorage.setItem('ca_city', city);
    const newIds = CLUBS.filter((c) => c.city === city).map((c) => c.id);
    setSelectedClubs(newIds);
    localStorage.setItem('ca_clubs', JSON.stringify(newIds));
  };

  // Geolocation — only on first visit (no ca_city saved)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('ca_city')) return;
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const city = detectCity(coords.latitude, coords.longitude);
        if (city && city !== 'Warszawa') setCity(city);
      },
      () => {},
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Day ───────────────────────────────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    if (typeof window === 'undefined') return 'today';
    const saved = localStorage.getItem('ca_day');
    return saved && DAY_PRESET_IDS.includes(saved) ? saved : 'today';
  });

  // ── Time ──────────────────────────────────────────────────────────────────
  const [fromHour, setFromHour] = useState<number>(() => {
    if (typeof window === 'undefined') return 17;
    return parseInt(localStorage.getItem('ca_from') || '17');
  });

  const [toHour, setToHour] = useState<number>(() => {
    if (typeof window === 'undefined') return 21;
    return parseInt(localStorage.getItem('ca_to') || '21');
  });

  // ── Clubs ─────────────────────────────────────────────────────────────────
  const [selectedClubs, setSelectedClubs] = useState<string[]>(() => {
    const cityIds = CLUBS.filter((c) => c.city === initialCity).map((c) => c.id);
    if (typeof window === 'undefined') return cityIds;
    const saved = localStorage.getItem('ca_clubs');
    if (saved) {
      const parsed: string[] = JSON.parse(saved);
      const valid = parsed.filter((id) => cityIds.includes(id));
      return valid.length > 0 ? valid : cityIds;
    }
    return cityIds;
  });

  const handleDayChange = (id: string) => {
    setSelectedDay(id);
    if (DAY_PRESET_IDS.includes(id)) localStorage.setItem('ca_day', id);
  };

  const handleTimeChange = (from: number, to: number) => {
    setFromHour(from);
    setToHour(to);
    localStorage.setItem('ca_from', String(from));
    localStorage.setItem('ca_to', String(to));
  };

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
    const allIds = clubsForCity.map((c) => c.id);
    const next = selectedClubs.length === clubsForCity.length ? [clubsForCity[0].id] : allIds;
    setSelectedClubs(next);
    localStorage.setItem('ca_clubs', JSON.stringify(next));
  };

  return {
    selectedCity, setCity, cities, clubsForCity,
    selectedDay, fromHour, toHour, activeTimePreset, selectedClubs,
    handleDayChange, handleTimeChange, toggleClub, toggleAllClubs,
  };
}
