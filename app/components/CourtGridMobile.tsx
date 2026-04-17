'use client';

import { useState } from 'react';
import { TimeSlot } from '@/lib/types';
import { Club } from '@/lib/clubs';
import { CLUB_COLORS } from './colors';
import { formatDatePL } from '@/lib/presets';
import SlotModal from './SlotModal';
import { useCourtGrid } from './useCourtGrid';

function CourtIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="10" viewBox="0 0 14 11" fill="none" className={className}>
      <rect x="0.5" y="0.5" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1"/>
      <line x1="7" y1="0.5" x2="7" y2="10.5" stroke="currentColor" strokeWidth="0.9"/>
      <line x1="0.5" y1="5.5" x2="13.5" y2="5.5" stroke="currentColor" strokeWidth="0.9"/>
    </svg>
  );
}

function formatDuration(minutes: number): string {
  if (minutes === 60) return '1h';
  if (minutes === 90) return '1.5h';
  if (minutes === 120) return '2h';
  return `${minutes / 60}h`;
}

function getSlotSummary(slots: TimeSlot[]) {
  const durations = [...new Set(slots.map((s) => s.duration))].sort((a, b) => a - b);
  const courts = new Set(slots.map((s) => s.courtId)).size;
  const shortest = durations[0];
  const hasMultipleDurations = durations.length > 1;

  // Cena najkrótszego dostępnego czasu
  const shortestPrices = slots
    .filter((s) => s.duration === shortest && s.price)
    .map((s) => parseFloat(s.price!.replace(/[^\d.]/g, '')))
    .filter((p) => !isNaN(p));
  const minPrice = shortestPrices.length > 0 ? Math.min(...shortestPrices) : null;

  const durationStr = formatDuration(shortest);
  // "od" gdy są dłuższe opcje
  const priceStr = minPrice !== null
    ? `${hasMultipleDurations ? 'od ' : ''}${Math.round(minPrice)} PLN`
    : null;

  return { durationStr, hasMultipleDurations, priceStr, courts };
}

interface Props {
  slots: TimeSlot[];
  clubs: Club[];
  selectedClubs: string[];
}

export default function CourtGridMobile({ slots, clubs, selectedClubs }: Props) {
  const [modal, setModal] = useState<TimeSlot[] | null>(null);

  const visibleClubs = clubs.filter((c) => selectedClubs.includes(c.id));
  const { dates, times, grid } = useCourtGrid(slots);

  if (slots.length === 0) return null;

  return (
    <>
      <div className="space-y-6">
        {dates.map((date) => {
          const dateTimes = times.filter((t) =>
            visibleClubs.some((c) => grid[date]?.[t]?.[c.id]?.length)
          );
          if (!dateTimes.length) return null;

          const totalForDate = dateTimes.reduce(
            (sum, t) =>
              sum + visibleClubs.reduce((s, c) => s + (grid[date]?.[t]?.[c.id]?.length || 0), 0),
            0
          );

          return (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 bg-[#080810] py-2 -mx-4 px-4">
                <h3 className="text-base font-semibold text-white">{formatDatePL(date)}</h3>
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">
                  {totalForDate === 1 ? '1 slot' : totalForDate <= 4 ? `${totalForDate} sloty` : `${totalForDate} slotów`}
                </span>
              </div>

              {/* Time groups */}
              <div className="space-y-4">
                {dateTimes.map((time) => {
                  const clubsWithSlots = visibleClubs.filter(
                    (c) => (grid[date]?.[time]?.[c.id]?.length || 0) > 0
                  );

                  return (
                    <div key={time}>
                      {/* Time label */}
                      <p className="text-[11px] font-mono font-bold text-gray-600 tabular-nums mb-1.5 px-1 uppercase tracking-wider">
                        {time}
                      </p>

                      {/* Club rows — stałe kolumny jak tabela */}
                      <div className="space-y-[3px]">
                        {clubsWithSlots.map((club) => {
                          const cellSlots = grid[date]?.[time]?.[club.id] || [];
                          const color = CLUB_COLORS[club.id];
                          const { durationStr, hasMultipleDurations, priceStr, courts } = getSlotSummary(cellSlots);

                          return (
                            <button
                              key={club.id}
                              onClick={() => setModal(cellSlots)}
                              className="w-full flex items-center px-3 py-2.5 rounded-xl border active:scale-[0.98] transition-transform"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderColor: 'rgba(255,255,255,0.06)',
                              }}
                            >
                              {/* Dot */}
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 mr-2.5 ${color?.dot}`} />

                              {/* Nazwa — flex-1, obcina za długie */}
                              <span className="text-sm font-medium text-gray-200 flex-1 min-w-0 truncate text-left">
                                {club.shortName ?? club.name.split(' ')[0]}
                              </span>

                              {/* Czas — stała szerokość, wyśrodkowany */}
                              <span className="text-xs text-gray-500 w-10 text-center flex-shrink-0">
                                {durationStr}{hasMultipleDurations && <span className="text-gray-700">+</span>}
                              </span>

                              {/* Cena — stała szerokość, do prawej */}
                              <span className="text-xs font-semibold w-20 text-right flex-shrink-0 tabular-nums" style={{ color: priceStr ? 'rgb(209 213 219)' : 'rgb(55 65 81)' }}>
                                {priceStr ?? '—'}
                              </span>

                              {/* Korty — stała szerokość, do prawej */}
                              <span className="flex items-center justify-end gap-1 w-8 flex-shrink-0 text-gray-500 ml-1">
                                <CourtIcon />
                                <span className="text-xs font-bold tabular-nums">{courts}</span>
                              </span>

                              {/* Chevron */}
                              <span className="text-gray-700 ml-2 flex-shrink-0 text-sm">›</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {modal && <SlotModal slots={modal} onClose={() => setModal(null)} />}
    </>
  );
}
