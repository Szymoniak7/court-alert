'use client';

import { CLUBS } from '@/lib/clubs';
import { DAY_OPTIONS, TIME_OPTIONS } from '@/lib/presets';
import { CLUB_COLORS } from './components/colors';
import CourtGrid from './components/CourtGrid';
import CourtGridMobile from './components/CourtGridMobile';
import { useFilters } from './hooks/useFilters';
import { useSlots } from './hooks/useSlots';

export default function Home() {
  const filters = useFilters();
  const {
    selectedDay, selectedTimes, selectedClubs,
    fromHour, toHour,
    toggleTime, toggleClub, toggleAllClubs,
  } = filters;

  const slotsState = useSlots({ selectedDay, selectedClubs, fromHour, toHour });
  const {
    slots, errors, loading, isRefreshing,
    lastUpdated, now,
    fetchSlots, resetSlots, setErrors,
    getEmptyMessage, slotLabel,
  } = slotsState;

  // Wrap day/time changes to also clear stale slot data
  const handleDayChange = (id: string) => {
    filters.handleDayChange(id);
    resetSlots();
  };

  const handleToggleTime = (id: string) => {
    toggleTime(id);
    resetSlots();
  };

  const dayOpt = DAY_OPTIONS.find((d) => d.id === selectedDay) ?? DAY_OPTIONS[0];
  const totalSlots = slots.length;

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">

      {/* Error banner */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-red-400">⚠</span>
          <span className="text-xs text-red-400/80 flex-1">{errors.join(' · ')}</span>
          <button onClick={() => setErrors([])} className="text-red-400/50 hover:text-red-400 text-sm leading-none">×</button>
        </div>
      )}

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
          {lastUpdated && !isRefreshing && (
            <span className="text-xs text-white/20" title={lastUpdated.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}>
              {Math.floor((now - lastUpdated.getTime()) / 60000) < 1
                ? 'przed chwilą'
                : `${Math.floor((now - lastUpdated.getTime()) / 60000)} min temu`}
            </span>
          )}
          <button
            onClick={fetchSlots}
            disabled={loading || isRefreshing}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition border border-white/5"
          >
            <span className={(loading || isRefreshing) ? 'animate-spin inline-block' : ''}>↻</span>
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
                  onClick={() => handleToggleTime(opt.id)}
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
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Kluby</p>
              <button
                onClick={toggleAllClubs}
                className="text-[10px] text-white/25 hover:text-white/50 transition"
              >
                {selectedClubs.length === CLUBS.length ? 'Odznacz wszystko' : 'Zaznacz wszystko'}
              </button>
            </div>
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
          <div className="lg:hidden border-b border-white/5 px-4 py-2">
            <div className="flex gap-1.5 flex-wrap">
              {DAY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleDayChange(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
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
          <div className="lg:hidden border-b border-white/5 px-4 py-2">
            <div className="flex gap-1.5">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleToggleTime(opt.id)}
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
              <button
                onClick={toggleAllClubs}
                className="flex items-center px-2.5 py-1 rounded-full text-xs border border-white/5 text-white/25 hover:text-white/50 transition"
              >
                {selectedClubs.length === CLUBS.length ? 'Odznacz' : 'Wszystkie'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">

            {/* Status */}
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-sm font-semibold text-white/80">{dayOpt.label}</h2>
              <span className="text-xs text-white/25">·</span>
              <span className="text-xs text-white/25">{fromHour}:00 – {toHour === 24 ? '24:00' : `${toHour}:00`}</span>
              {!loading && totalSlots > 0 && (
                <span className="ml-auto text-xs text-white/25">{slotLabel(totalSlots)}</span>
              )}
            </div>

            {/* Initial loading (no data yet) */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative flex flex-col items-center" style={{ height: 80 }}>
                  {/* Ball */}
                  <div
                    className="animate-ball w-9 h-9 rounded-full"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, #c8f04a, #7ab800)',
                      boxShadow: '0 2px 8px rgba(122,184,0,0.4)',
                    }}
                  />
                  {/* Shadow */}
                  <div
                    className="animate-ball-shadow mt-1 rounded-full"
                    style={{ width: 28, height: 6, background: 'rgba(255,255,255,0.1)' }}
                  />
                </div>
                <span className="text-sm text-white/25">Sprawdzam korty...</span>
              </div>
            )}

            {/* Empty */}
            {!loading && !isRefreshing && slots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center text-3xl mb-4">
                  🎾
                </div>
                <p className="font-medium text-white/50">{getEmptyMessage().title}</p>
                <p className="text-sm text-white/25 mt-1">{getEmptyMessage().sub}</p>
              </div>
            )}

            {/* Grid — desktop */}
            {!loading && slots.length > 0 && (
              <div className={`hidden lg:block transition-opacity duration-200 ${isRefreshing ? 'opacity-40' : 'opacity-100'}`}>
                <CourtGrid slots={slots} clubs={CLUBS} selectedClubs={selectedClubs} />
              </div>
            )}

            {/* Grid — mobile */}
            {!loading && slots.length > 0 && (
              <div className={`lg:hidden transition-opacity duration-200 ${isRefreshing ? 'opacity-40' : 'opacity-100'}`}>
                <CourtGridMobile slots={slots} clubs={CLUBS} selectedClubs={selectedClubs} />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
