'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeSlot } from '@/lib/types';
import { CLUBS } from '@/lib/clubs';
import { PRESETS, formatDatePL } from '@/lib/presets';

const CLUB_COLORS: Record<string, { dot: string; badge: string }> = {
  'loba-padel':        { dot: 'bg-emerald-400',  badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  'mana-padel':        { dot: 'bg-blue-400',      badge: 'bg-blue-950 text-blue-300 border-blue-800' },
  'toro-padel':        { dot: 'bg-orange-400',    badge: 'bg-orange-950 text-orange-300 border-orange-800' },
  'interpadel':        { dot: 'bg-purple-400',    badge: 'bg-purple-950 text-purple-300 border-purple-800' },
  'warsaw-padel-club': { dot: 'bg-rose-400',      badge: 'bg-rose-950 text-rose-300 border-rose-800' },
  'rqt-sport':         { dot: 'bg-yellow-400',    badge: 'bg-yellow-950 text-yellow-300 border-yellow-800' },
  'padlovnia':         { dot: 'bg-cyan-400',      badge: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
};

function groupByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  return slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});
}

function groupByTime(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  return slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    if (!acc[slot.startTime]) acc[slot.startTime] = [];
    acc[slot.startTime].push(slot);
    return acc;
  }, {});
}

export default function Home() {
  const [activePreset, setActivePreset] = useState(PRESETS[0].id);
  const [selectedClubs, setSelectedClubs] = useState<string[]>(CLUBS.map((c) => c.id));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const preset = PRESETS.find((p) => p.id === activePreset)!;

  const fetchSlots = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      const dates = preset.getDates();
      const params = new URLSearchParams({
        dates: dates.join(','),
        from: String(preset.fromHour),
        to: String(preset.toHour),
        clubs: selectedClubs.join(','),
      });
      const res = await fetch(`/api/availability?${params}`, { signal: ctrl.signal });
      const data = await res.json();
      setSlots(data.slots || []);
      setErrors(data.errors || []);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activePreset, selectedClubs, preset]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const toggleClub = (id: string) =>
    setSelectedClubs((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const byDate = groupByDate(slots);
  const totalCount = slots.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Top bar */}
      <header className="border-b border-gray-800 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">Court Alert</span>
          <span className="hidden sm:inline text-xs text-gray-500 font-normal">Warszawa · padel</span>
        </div>
        <button
          onClick={fetchSlots}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          <span className="hidden sm:inline">Odśwież</span>
        </button>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col w-56 border-r border-gray-800 px-4 py-5 flex-shrink-0 gap-6">

          {/* Presets */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Widok</p>
            <div className="space-y-1">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    activePreset === p.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="block text-[11px] opacity-70">{p.sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Club filter */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Kluby</p>
            <div className="space-y-1">
              {CLUBS.map((club) => {
                const active = selectedClubs.includes(club.id);
                const color = CLUB_COLORS[club.id];
                return (
                  <button
                    key={club.id}
                    onClick={() => toggleClub(club.id)}
                    className={`w-full flex items-center gap-2.5 text-left px-2 py-1.5 rounded-lg transition ${
                      active ? 'text-white' : 'text-gray-500'
                    } hover:bg-gray-800`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? color?.dot : 'bg-gray-700'}`} />
                    <span className="text-xs truncate">{club.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {lastUpdated && (
            <p className="text-[11px] text-gray-600 mt-auto">
              {lastUpdated.toLocaleTimeString('pl-PL')}
            </p>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* Mobile: preset tabs */}
          <div className="lg:hidden border-b border-gray-800 px-4 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activePreset === p.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: club filter */}
          <div className="lg:hidden border-b border-gray-800 px-4 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {CLUBS.map((club) => {
                const active = selectedClubs.includes(club.id);
                const color = CLUB_COLORS[club.id];
                return (
                  <button
                    key={club.id}
                    onClick={() => toggleClub(club.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition ${
                      active
                        ? 'border-gray-600 text-white'
                        : 'border-gray-800 text-gray-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? color?.dot : 'bg-gray-700'}`} />
                    {club.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">

            {/* Status bar */}
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-semibold text-white">{preset.label}</h2>
              <span className="text-xs text-gray-500">{preset.sublabel}</span>
              {!loading && (
                <span className="ml-auto text-xs text-gray-500">
                  {totalCount} {totalCount === 1 ? 'slot' : 'slotów'}
                </span>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-3 py-12 justify-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Sprawdzam korty...</span>
              </div>
            )}

            {/* Empty */}
            {!loading && slots.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <p className="text-3xl mb-3">🎾</p>
                <p className="font-medium text-gray-400">Brak wolnych kortów</p>
                <p className="text-sm mt-1">w wybranym przedziale</p>
              </div>
            )}

            {/* Slots grouped by date */}
            {!loading && slots.length > 0 && (
              <div className="space-y-8">
                {Object.entries(byDate).map(([date, dateSlots]) => {
                  const byTime = groupByTime(dateSlots);
                  return (
                    <div key={date}>
                      {/* Date header */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <h3 className="font-semibold text-white">{formatDatePL(date)}</h3>
                        <span className="text-xs text-gray-500">{dateSlots.length} slotów</span>
                      </div>

                      {/* Time groups */}
                      <div className="space-y-3">
                        {Object.entries(byTime).map(([time, timeSlots]) => (
                          <div key={time} className="flex gap-3 items-start">
                            {/* Time label */}
                            <span className="text-sm font-mono font-semibold text-gray-400 w-12 flex-shrink-0 pt-2">
                              {time}
                            </span>

                            {/* Slot cards */}
                            <div className="flex flex-wrap gap-2 flex-1">
                              {timeSlots.map((slot, i) => {
                                const color = CLUB_COLORS[slot.clubId];
                                return (
                                  <a
                                    key={i}
                                    href={slot.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex flex-col px-3 py-2 rounded-xl border text-xs font-medium transition hover:opacity-80 active:scale-95 ${color?.badge || 'bg-gray-800 text-gray-300 border-gray-700'}`}
                                  >
                                    <span className="font-semibold">{slot.clubName}</span>
                                    <span className="opacity-70 font-normal mt-0.5">{slot.courtName} · –{slot.endTime}</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mt-6 space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400 bg-red-950/40 px-3 py-1.5 rounded-lg">
                    ⚠ {e}
                  </p>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
