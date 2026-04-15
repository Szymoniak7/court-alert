'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeSlot } from '@/lib/types';
import { CLUBS } from '@/lib/clubs';
import { DAY_OPTIONS, TIME_OPTIONS, getDates } from '@/lib/presets';
import { CLUB_COLORS } from './components/colors';
import CourtGrid from './components/CourtGrid';
import CourtGridMobile from './components/CourtGridMobile';

export default function Home() {
  const [selectedDay, setSelectedDay] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('ca_day') ?? 'weekdays') : 'weekdays'
  );
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
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeTimes = TIME_OPTIONS.filter((t) => selectedTimes.includes(t.id));
  const fromHour = activeTimes.length ? Math.min(...activeTimes.map((t) => t.fromHour)) : 0;
  const toHour = activeTimes.length ? Math.max(...activeTimes.map((t) => t.toHour)) : 24;
  const dayOpt = DAY_OPTIONS.find((d) => d.id === selectedDay)!;

  const fetchSlots = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const dates = getDates(selectedDay);
      const params = new URLSearchParams({
        dates: dates.join(','),
        from: String(fromHour),
        to: String(toHour),
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
  }, [selectedDay, selectedTimes, selectedClubs, fromHour, toHour]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

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
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      localStorage.setItem('ca_clubs', JSON.stringify(next));
      return next;
    });
  };

  const totalSlots = slots.length;

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">

      {/* Top bar */}
      <header className="border-b border-white/5 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0 backdrop-blur-sm bg-[#080810]/90 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold">C</div>
            <span className="font-semibold tracking-tight">Court Alert</span>
          </div>
          <span className="hidden sm:inline text-xs text-white/20 font-normal">Warszawa · padel</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && !loading && (
            <span className="text-xs text-white/20">
              {lastUpdated.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchSlots}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition border border-white/5"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
            <span className="hidden sm:inline text-xs">Odśwież</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col w-56 border-r border-white/5 px-3 py-5 flex-shrink-0 gap-6 bg-[#080810]">

          {/* Kiedy gram */}
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-2">Kiedy gram?</p>
            <div className="space-y-0.5">
              {DAY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleDayChange(opt.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition border ${
                    selectedDay === opt.id
                      ? 'bg-indigo-500/15 border-indigo-500/20 text-indigo-300'
                      : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white/70'
                  }`}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* O której */}
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-2">O której?</p>
            <div className="space-y-0.5">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleTime(opt.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition border ${
                    selectedTimes.includes(opt.id)
                      ? 'bg-indigo-500/15 border-indigo-500/20'
                      : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <span className={`block text-sm font-medium ${selectedTimes.includes(opt.id) ? 'text-indigo-300' : 'text-white/50'}`}>
                    {opt.label}
                  </span>
                  <span className="block text-[11px] text-white/25 mt-0.5">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Kluby */}
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-2">Kluby</p>
            <div className="space-y-0.5">
              {CLUBS.map((club) => {
                const active = selectedClubs.includes(club.id);
                const color = CLUB_COLORS[club.id];
                return (
                  <button
                    key={club.id}
                    onClick={() => toggleClub(club.id)}
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-xl transition border border-transparent ${
                      active ? '' : 'opacity-40'
                    } hover:bg-white/5`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? color?.dot : 'bg-white/20'}`} />
                    <span className="text-xs text-white/70 truncate">{club.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile — Kiedy gram */}
          <div className="lg:hidden border-b border-white/5 px-4 pt-3 pb-2">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Kiedy gram?</p>
            <div className="flex gap-1.5">
              {DAY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleDayChange(opt.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition border ${
                    selectedDay === opt.id
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/5 text-white/40 border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile — O której */}
          <div className="lg:hidden border-b border-white/5 px-4 pt-2.5 pb-2">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">O której?</p>
            <div className="flex gap-1.5">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleTime(opt.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition border ${
                    selectedTimes.includes(opt.id)
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/5 text-white/40 border-transparent'
                  }`}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile — Kluby */}
          <div className="lg:hidden border-b border-white/5 px-4 py-2">
            <div className="flex flex-wrap gap-1.5">
              {CLUBS.map((club) => {
                const active = selectedClubs.includes(club.id);
                const color = CLUB_COLORS[club.id];
                return (
                  <button
                    key={club.id}
                    onClick={() => toggleClub(club.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition ${
                      active ? 'border-white/15 text-white/70' : 'border-white/5 text-white/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? color?.dot : 'bg-white/20'}`} />
                    {club.shortName ?? club.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile legend */}
          <div className="lg:hidden border-b border-white/5 px-4 py-1.5 flex items-center gap-1.5">
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none" className="text-white/25">
              <rect x="0.5" y="0.5" width="10" height="8" rx="0.75" stroke="currentColor" strokeWidth="0.9"/>
              <line x1="5.5" y1="0.5" x2="5.5" y2="8.5" stroke="currentColor" strokeWidth="0.75"/>
              <line x1="0.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="0.75"/>
            </svg>
            <span className="text-[10px] text-white/25">= liczba wolnych kortów w danej godzinie</span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">

            {/* Status */}
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-sm font-semibold text-white/80">{dayOpt.label}</h2>
              <span className="text-xs text-white/25">·</span>
              <span className="text-xs text-white/25">{fromHour}:00 – {toHour === 24 ? '24:00' : `${toHour}:00`}</span>
              {!loading && totalSlots > 0 && (
                <span className="ml-auto text-xs text-white/25">
                  {totalSlots} {totalSlots === 1 ? 'slot' : 'slotów'}
                </span>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500/40 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-sm text-white/25">Sprawdzam korty...</span>
              </div>
            )}

            {/* Empty */}
            {!loading && slots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center text-3xl mb-4">
                  🎾
                </div>
                <p className="font-medium text-white/50">Brak wolnych kortów</p>
                <p className="text-sm text-white/25 mt-1">w wybranym przedziale czasowym</p>
              </div>
            )}

            {/* Grid — desktop */}
            {!loading && slots.length > 0 && (
              <div className="hidden lg:block">
                <CourtGrid
                  slots={slots}
                  clubs={CLUBS}
                  selectedClubs={selectedClubs}
                />
              </div>
            )}

            {/* Grid — mobile */}
            {!loading && slots.length > 0 && (
              <div className="lg:hidden">
                <CourtGridMobile
                  slots={slots}
                  clubs={CLUBS}
                  selectedClubs={selectedClubs}
                />
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mt-6 space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400/70 bg-red-500/5 border border-red-500/10 px-3 py-2 rounded-lg">
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
