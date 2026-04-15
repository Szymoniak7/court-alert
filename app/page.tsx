'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeSlot } from '@/lib/types';
import { CLUBS } from '@/lib/clubs';
import { PRESETS, formatDatePL } from '@/lib/presets';
import { CLUB_COLORS } from './components/colors';
import CourtGrid from './components/CourtGrid';
import CourtGridMobile from './components/CourtGridMobile';

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

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const toggleClub = (id: string) =>
    setSelectedClubs((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

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
            <span className="hidden sm:inline text-xs text-white/20">
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
        <aside className="hidden lg:flex flex-col w-52 border-r border-white/5 px-3 py-5 flex-shrink-0 gap-6 bg-[#080810]">

          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-2">Widok</p>
            <div className="space-y-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition group ${
                    activePreset === p.id
                      ? 'bg-indigo-500/15 border border-indigo-500/20'
                      : 'border border-transparent hover:bg-white/5'
                  }`}
                >
                  <span className={`block text-sm font-medium ${activePreset === p.id ? 'text-indigo-300' : 'text-white/60 group-hover:text-white/80'}`}>
                    {p.label}
                  </span>
                  <span className="block text-[11px] text-white/25 mt-0.5">{p.sublabel}</span>
                </button>
              ))}
            </div>
          </div>

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
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-xl transition border ${
                      active ? 'border-transparent' : 'border-transparent opacity-40'
                    } hover:bg-white/5`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 transition ${active ? color?.dot : 'bg-white/20'}`} />
                    <span className="text-xs text-white/70 truncate">{club.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile presets */}
          <div className="lg:hidden border-b border-white/5 px-4 py-2.5">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activePreset === p.id
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/5 text-white/40 border border-transparent'
                  }`}
                >
                  {p.mobileLabel ?? p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile clubs */}
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
              <h2 className="text-sm font-semibold text-white/80">{preset.label}</h2>
              <span className="text-xs text-white/25">{preset.sublabel}</span>
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
