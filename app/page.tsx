'use client';

import { CLUBS } from '@/lib/clubs';
import {
  TIME_PRESETS,
  getNextDays, formatDate, getDayLabel, SHORT_DAYS,
} from '@/lib/presets';
import { CLUB_COLORS } from './components/colors';
import CourtGrid from './components/CourtGrid';
import CourtGridMobile from './components/CourtGridMobile';
import { useFilters } from './hooks/useFilters';
import { useSlots } from './hooks/useSlots';

export default function Home() {
  const filters = useFilters();
  const {
    selectedDay, fromHour, toHour, activeTimePreset, selectedClubs,
    handleDayChange, handleTimeChange, toggleClub, toggleAllClubs,
  } = filters;

  const slotsState = useSlots({ selectedDay, selectedClubs, fromHour, toHour });
  const {
    slots, errors, loading, isRefreshing, hasEverLoaded,
    lastUpdated, now,
    fetchSlots, resetSlots, setErrors,
    getEmptyMessage, slotLabel,
  } = slotsState;

  const onDayChange = (id: string) => { handleDayChange(id); resetSlots(); };
  const onTimeChange = (from: number, to: number) => { handleTimeChange(from, to); resetSlots(); };

  const today = formatDate(new Date());
  // tomorrow + next 12 days as specific dates
  const upcomingDays = getNextDays(14).slice(1);
  const tomorrow = upcomingDays[0];
  // days after tomorrow for the scrollable chips
  const laterDays = upcomingDays.slice(1);

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

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex flex-col w-56 border-r border-white/5 px-3 py-5 flex-shrink-0 gap-5 bg-[#080810] overflow-y-auto">

          {/* Kiedy gram? */}
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3 px-2">Kiedy gram?</p>

            {/* Dziś + Jutro + Weekend */}
            <div className="flex gap-1 mb-2">
              {[
                { id: 'today',   label: 'Dziś' },
                { id: tomorrow,  label: 'Jutro' },
                { id: 'weekend', label: 'Weekend' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => onDayChange(p.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition text-center ${
                    selectedDay === p.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/5 text-white/40 hover:bg-white/8 hover:text-white/70'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Upcoming dates list */}
            <div className="space-y-0.5 max-h-52 overflow-y-auto scrollbar-hide">
              {laterDays.map((date) => {
                const d = new Date(date + 'T12:00:00');
                const active = selectedDay === date;
                return (
                  <button
                    key={date}
                    onClick={() => onDayChange(date)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-2 ${
                      active
                        ? 'bg-indigo-500/15 text-indigo-300'
                        : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                    }`}
                  >
                    <span className={`text-[10px] w-6 ${active ? 'text-indigo-400' : 'text-white/25'}`}>
                      {SHORT_DAYS[d.getDay()]}
                    </span>
                    <span className="text-sm font-medium">{d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}</span>
                  </button>
                );
              })}
              <div className="relative">
                <input
                  type="date"
                  min={today}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={(e) => { if (e.target.value) onDayChange(e.target.value); }}
                />
                <div className="px-3 py-2 text-xs text-white/25 hover:text-white/50 transition cursor-pointer">
                  📅 Wybierz datę...
                </div>
              </div>
            </div>
          </div>

          {/* O której? */}
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-2">O której?</p>
            <div className="space-y-0.5">
              {TIME_PRESETS.map((opt) => {
                const active = activeTimePreset === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onTimeChange(opt.fromHour, opt.toHour)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition border ${
                      active ? 'bg-indigo-500/15 border-indigo-500/20' : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <span className={`block text-sm font-medium ${active ? 'text-indigo-300' : 'text-white/50'}`}>
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-white/25 mt-0.5">{opt.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kluby */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Kluby</p>
              <button onClick={toggleAllClubs} className="text-[10px] text-white/25 hover:text-white/50 transition">
                {selectedClubs.length === CLUBS.length ? 'Odznacz' : 'Zaznacz wszystko'}
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

        {/* ── Mobile + Main ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile — date strip (Booksy-style) */}
          <div className="lg:hidden border-b border-white/5 px-3 py-2.5">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">

              {/* Dziś */}
              <button
                onClick={() => onDayChange('today')}
                className={`flex-shrink-0 flex items-center justify-center px-5 h-14 rounded-2xl text-sm font-semibold transition ${
                  selectedDay === 'today'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/6 text-white/50 hover:bg-white/10'
                }`}
              >
                Dziś
              </button>

              {/* Jutro */}
              <button
                onClick={() => onDayChange(tomorrow)}
                className={`flex-shrink-0 flex items-center justify-center px-5 h-14 rounded-2xl text-sm font-semibold transition ${
                  selectedDay === tomorrow
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/6 text-white/50 hover:bg-white/10'
                }`}
              >
                Jutro
              </button>

              {/* Separator */}
              <div className="flex-shrink-0 w-px bg-white/8 mx-0.5 my-2.5" />

              {/* Specific upcoming dates */}
              {laterDays.map((date) => {
                const d = new Date(date + 'T12:00:00');
                const active = selectedDay === date;
                return (
                  <button
                    key={date}
                    onClick={() => onDayChange(date)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition ${
                      active
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/6 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <span className={`text-[11px] font-medium ${active ? 'text-white/75' : 'text-white/35'}`}>
                      {SHORT_DAYS[d.getDay()]}
                    </span>
                    <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                  </button>
                );
              })}

              {/* Calendar picker */}
              <div className="relative flex-shrink-0">
                <input
                  type="date"
                  min={today}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={(e) => { if (e.target.value) onDayChange(e.target.value); }}
                />
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/6 text-white/30 hover:bg-white/10 transition text-xl">
                  📅
                </div>
              </div>

            </div>
          </div>

          {/* Mobile — time presets */}
          <div className="lg:hidden border-b border-white/5 px-3 py-2">
            <div className="flex gap-1.5">
              {TIME_PRESETS.map((opt) => {
                const active = activeTimePreset === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onTimeChange(opt.fromHour, opt.toHour)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                      active
                        ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                        : 'bg-white/5 text-white/40 hover:bg-white/8'
                    }`}
                  >
                    <span className="block font-semibold">{opt.label}</span>
                    <span className="block text-[10px] opacity-60 mt-0.5">{opt.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile — clubs */}
          <div className="lg:hidden border-b border-white/5 px-3 py-2">
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
              <h2 className="text-sm font-semibold text-white/80">{getDayLabel(selectedDay)}</h2>
              <span className="text-xs text-white/25">·</span>
              <span className="text-xs text-white/25">{fromHour}:00 – {toHour === 24 ? '24:00' : `${toHour}:00`}</span>
              {!loading && totalSlots > 0 && (
                <span className="ml-auto text-xs text-white/25">{slotLabel(totalSlots)}</span>
              )}
            </div>

            {/* Initial loading */}
            {loading && slots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative flex flex-col items-center" style={{ height: 80 }}>
                  <div
                    className="animate-ball w-9 h-9 rounded-full"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, #c8f04a, #7ab800)',
                      boxShadow: '0 2px 8px rgba(122,184,0,0.4)',
                    }}
                  />
                  <div
                    className="animate-ball-shadow mt-1 rounded-full"
                    style={{ width: 28, height: 6, background: 'rgba(255,255,255,0.1)' }}
                  />
                </div>
                <span className="text-sm text-white/25">Sprawdzam korty...</span>
              </div>
            )}

            {/* Empty */}
            {!loading && !isRefreshing && hasEverLoaded && slots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center text-3xl mb-4">
                  🎾
                </div>
                <p className="font-medium text-white/50">{getEmptyMessage().title}</p>
                <p className="text-sm text-white/25 mt-1">{getEmptyMessage().sub}</p>
              </div>
            )}

            {/* Grid — desktop */}
            {slots.length > 0 && (
              <div className={`hidden lg:block transition-opacity duration-200 ${isRefreshing && hasEverLoaded ? 'opacity-40' : 'opacity-100'}`}>
                <CourtGrid slots={slots} clubs={CLUBS} selectedClubs={selectedClubs} />
              </div>
            )}

            {/* Grid — mobile */}
            {slots.length > 0 && (
              <div className={`lg:hidden transition-opacity duration-200 ${isRefreshing && hasEverLoaded ? 'opacity-40' : 'opacity-100'}`}>
                <CourtGridMobile slots={slots} clubs={CLUBS} selectedClubs={selectedClubs} />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
