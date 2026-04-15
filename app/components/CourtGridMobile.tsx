'use client';

import { useState, useMemo } from 'react';
import { TimeSlot } from '@/lib/types';
import { Club } from '@/lib/clubs';
import { CLUB_COLORS } from './colors';
import { formatDatePL } from '@/lib/presets';
import SlotModal from './SlotModal';

function CourtIcon({ className }: { className?: string }) {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" className={className}>
      <rect x="0.5" y="0.5" width="10" height="8" rx="0.75" stroke="currentColor" strokeWidth="0.9"/>
      <line x1="5.5" y1="0.5" x2="5.5" y2="8.5" stroke="currentColor" strokeWidth="0.75"/>
      <line x1="0.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="0.75"/>
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

  const { dates, times, grid } = useMemo(() => {
    const dateSet = new Set<string>();
    const timeSet = new Set<string>();
    const grid: Record<string, Record<string, Record<string, TimeSlot[]>>> = {};

    for (const slot of slots) {
      dateSet.add(slot.date);
      timeSet.add(slot.startTime);
      if (!grid[slot.date]) grid[slot.date] = {};
      if (!grid[slot.date][slot.startTime]) grid[slot.date][slot.startTime] = {};
      if (!grid[slot.date][slot.startTime][slot.clubId]) grid[slot.date][slot.startTime][slot.clubId] = [];
      grid[slot.date][slot.startTime][slot.clubId].push(slot);
    }

    return {
      dates: Array.from(dateSet).sort(),
      times: Array.from(timeSet).sort(),
      grid,
    };
  }, [slots]);

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
              <div className="flex items-center gap-3 mb-3 px-1">
                <h3 className="text-base font-semibold text-white">{formatDatePL(date)}</h3>
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">{totalForDate} slotów</span>
              </div>

              {/* Time rows */}
              <div className="space-y-2">
                {dateTimes.map((time) => {
                  const clubsWithSlots = visibleClubs.filter(
                    (c) => (grid[date]?.[time]?.[c.id]?.length || 0) > 0
                  );

                  return (
                    <div key={time} className="flex items-start gap-3">
                      {/* Time */}
                      <span className="text-sm font-mono font-semibold text-gray-400 tabular-nums w-12 pt-1.5 flex-shrink-0">
                        {time}
                      </span>

                      {/* Club chips */}
                      <div className="flex flex-wrap gap-2 flex-1">
                        {clubsWithSlots.map((club) => {
                          const cellSlots = grid[date]?.[time]?.[club.id] || [];
                          const count = cellSlots.length;
                          const color = CLUB_COLORS[club.id];

                          return (
                            <button
                              key={club.id}
                              onClick={() => setModal(cellSlots)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition ${color?.cell}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color?.dot}`} />
                              <span className="text-xs font-medium">{club.shortName ?? club.name.split(' ')[0]}</span>
                              <CourtIcon className="opacity-50" />
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
