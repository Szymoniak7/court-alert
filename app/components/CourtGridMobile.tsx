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
    <svg width="13" height="10" viewBox="0 0 14 11" fill="none" className={className}>
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

  const prices = slots
    .filter((s) => s.price)
    .map((s) => parseFloat(s.price!.replace(/[^\d.]/g, '')))
    .filter((p) => !isNaN(p));
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;

  const durationStr =
    durations.length === 1
      ? formatDuration(durations[0])
      : durations.map(formatDuration).join('/');

  const priceStr = minPrice !== null ? `${Math.round(minPrice)} PLN` : null;

  return { durationStr, priceStr, courts };
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
              sum +
              visibleClubs.reduce(
                (s, c) => s + (grid[date]?.[t]?.[c.id]?.length || 0),
                0
              ),
            0
          );

          return (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 bg-[#080810] py-2 -mx-4 px-4">
                <h3 className="text-base font-semibold text-white">{formatDatePL(date)}</h3>
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">
                  {totalForDate === 1
                    ? '1 slot'
                    : totalForDate <= 4
                    ? `${totalForDate} sloty`
                    : `${totalForDate} slotów`}
                </span>
              </div>

              {/* Time groups */}
              <div className="space-y-3">
                {dateTimes.map((time) => {
                  const clubsWithSlots = visibleClubs.filter(
                    (c) => (grid[date]?.[time]?.[c.id]?.length || 0) > 0
                  );

                  return (
                    <div key={time}>
                      {/* Time label */}
                      <p className="text-xs font-mono font-semibold text-gray-600 tabular-nums mb-1.5 px-1">
                        {time}
                      </p>

                      {/* Club rows */}
                      <div className="space-y-1">
                        {clubsWithSlots.map((club) => {
                          const cellSlots = grid[date]?.[time]?.[club.id] || [];
                          const color = CLUB_COLORS[club.id];
                          const { durationStr, priceStr, courts } = getSlotSummary(cellSlots);

                          return (
                            <button
                              key={club.id}
                              onClick={() => setModal(cellSlots)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all active:scale-[0.98] text-left"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderColor: 'rgba(255,255,255,0.06)',
                              }}
                            >
                              {/* Color dot */}
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color?.dot}`} />

                              {/* Club name */}
                              <span className="text-sm font-medium text-gray-200 flex-1 truncate">
                                {club.shortName ?? club.name.split(' ')[0]}
                              </span>

                              {/* Duration */}
                              <span className="text-xs text-gray-500 flex-shrink-0 w-8 text-right">
                                {durationStr}
                              </span>

                              {/* Price */}
                              {priceStr ? (
                                <span className="text-xs font-semibold text-gray-300 flex-shrink-0 w-16 text-right">
                                  {priceStr}
                                </span>
                              ) : (
                                <span className="w-16 flex-shrink-0" />
                              )}

                              {/* Courts */}
                              <div className="flex items-center gap-1 flex-shrink-0 text-gray-500 w-7 justify-end">
                                <CourtIcon />
                                <span className="text-xs font-bold tabular-nums">{courts}</span>
                              </div>

                              {/* Chevron */}
                              <span className="text-gray-700 text-base flex-shrink-0">›</span>
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
