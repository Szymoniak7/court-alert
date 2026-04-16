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
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" className={className}>
      <rect x="0.5" y="0.5" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1"/>
      <line x1="7" y1="0.5" x2="7" y2="10.5" stroke="currentColor" strokeWidth="0.9"/>
      <line x1="0.5" y1="5.5" x2="13.5" y2="5.5" stroke="currentColor" strokeWidth="0.9"/>
    </svg>
  );
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
            (sum, t) => sum + visibleClubs.reduce((s, c) => s + (grid[date]?.[t]?.[c.id]?.length || 0), 0),
            0
          );

          return (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 bg-[#080810] py-2 -mx-4 px-4">
                <h3 className="text-base font-semibold text-white">{formatDatePL(date)}</h3>
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">{totalForDate} slotów</span>
              </div>

              {/* Time rows */}
              <div className="divide-y divide-white/5">
                {dateTimes.map((time) => {
                  const clubsWithSlots = visibleClubs.filter(
                    (c) => (grid[date]?.[time]?.[c.id]?.length || 0) > 0
                  );

                  return (
                    <div key={time} className="flex items-center gap-3 py-2.5">
                      {/* Time */}
                      <span className="text-sm font-mono font-semibold text-gray-400 tabular-nums w-12 flex-shrink-0">
                        {time}
                      </span>

                      {/* Club chips */}
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {clubsWithSlots.map((club) => {
                          const cellSlots = grid[date]?.[time]?.[club.id] || [];
                          const count = new Set(cellSlots.map((s) => s.courtId)).size;
                          const color = CLUB_COLORS[club.id];

                          return (
                            <button
                              key={club.id}
                              onClick={() => setModal(cellSlots)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${color?.cell}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color?.dot}`} />
                              <span className="text-xs font-medium">{club.shortName ?? club.name.split(' ')[0]}</span>
                              <CourtIcon className="opacity-60" />
                              <span className="text-xs font-bold tabular-nums">{count}</span>
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
