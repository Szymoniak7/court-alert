'use client';

import { useState } from 'react';
import { TimeSlot } from '@/lib/types';
import { Club } from '@/lib/clubs';
import { CLUB_COLORS } from './colors';
import { formatDatePL } from '@/lib/presets';
import SlotModal from './SlotModal';
import { useCourtGrid } from './useCourtGrid';

function getCourtType(slots: TimeSlot[]): 'indoor' | 'outdoor' | 'both' | null {
  const types = new Set(slots.map((s) => s.courtType).filter(Boolean));
  if (types.size === 0) return null;
  if (types.has('indoor') && types.has('outdoor')) return 'both';
  if (types.has('indoor')) return 'indoor';
  return 'outdoor';
}

function CourtTypeBadge({ type }: { type: 'indoor' | 'outdoor' | 'both' }) {
  if (type === 'indoor') {
    return (
      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-900/50 text-blue-300 leading-none whitespace-nowrap">
        hala
      </span>
    );
  }
  if (type === 'outdoor') {
    return (
      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-900/50 text-amber-300 leading-none whitespace-nowrap">
        zewn.
      </span>
    );
  }
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 leading-none whitespace-nowrap">
      oba
    </span>
  );
}

interface Props {
  slots: TimeSlot[];
  clubs: Club[];
  selectedClubs: string[];
}

export default function CourtGrid({ slots, clubs, selectedClubs }: Props) {
  const [modal, setModal] = useState<TimeSlot[] | null>(null);

  const visibleClubs = clubs.filter((c) => selectedClubs.includes(c.id));

  const { dates, times, grid } = useCourtGrid(slots);

  if (slots.length === 0) return null;

  return (
    <>
      <div className="space-y-8">
        {dates.map((date) => {
          const dateTimes = times.filter((t) =>
            visibleClubs.some((c) => grid[date]?.[t]?.[c.id]?.length)
          );
          if (!dateTimes.length) return null;

          return (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <h3 className="text-base font-semibold text-white">{formatDatePL(date)}</h3>
                <div className="flex-1 h-px bg-gray-800" />
                {(() => {
                  const n = dateTimes.reduce((sum, t) =>
                    sum + visibleClubs.reduce((s, c) => s + (grid[date]?.[t]?.[c.id]?.length || 0), 0), 0);
                  return (
                    <span className="text-xs text-gray-600">
                      {n === 1 ? '1 slot' : n <= 4 ? `${n} sloty` : `${n} slotów`}
                    </span>
                  );
                })()}
              </div>

              {/* Grid */}
              <div className="overflow-x-auto rounded-xl border border-gray-800/60">
                <table className="w-full border-collapse">
                  {/* Club headers */}
                  <thead className="sticky top-0 z-20">
                    <tr className="border-b border-gray-800">
                      <th className="w-16 min-w-[4rem] py-3 px-3 text-left sticky left-0 bg-[#080810] z-10 border-r border-gray-800">
                        <span className="text-xs text-gray-600 font-normal">Czas</span>
                      </th>
                      {visibleClubs.map((club) => {
                        const color = CLUB_COLORS[club.id];
                        return (
                          <th key={club.id} className="py-3 px-2 text-center min-w-[7rem] bg-[#080810]">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${color?.dot}`} />
                              <span className={`text-xs font-medium leading-tight ${color?.header} whitespace-nowrap`}>
                                {club.name.split(' ')[0]}
                              </span>
                              {club.name.split(' ').length > 1 && (
                                <span className="text-[10px] text-gray-600 leading-none whitespace-nowrap">
                                  {club.name.split(' ').slice(1).join(' ')}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Rows */}
                  <tbody>
                    {dateTimes.map((time, rowIdx) => (
                      <tr
                        key={time}
                        className={`border-b border-gray-800/50 ${rowIdx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                      >
                        {/* Time cell */}
                        <td className="py-2 px-3 sticky left-0 bg-[#080810] z-10 border-r border-gray-800/60">
                          <span className="text-sm font-mono font-semibold text-gray-400 tabular-nums">
                            {time}
                          </span>
                        </td>

                        {/* Club cells */}
                        {visibleClubs.map((club) => {
                          const cellSlots = grid[date]?.[time]?.[club.id] || [];
                          const count = new Set(cellSlots.map((s) => s.courtId)).size;
                          const color = CLUB_COLORS[club.id];

                          if (!count) {
                            return (
                              <td key={club.id} className="py-2 px-2 text-center">
                                <span className="text-gray-800 text-xs">—</span>
                              </td>
                            );
                          }

                          const courtType = getCourtType(cellSlots);
                          return (
                            <td key={club.id} className="py-2 px-2 text-center">
                              <button
                                onClick={() => setModal(cellSlots)}
                                className={`inline-flex flex-col items-center justify-center w-full rounded-lg border px-2 py-1.5 transition cursor-pointer ${color?.cell}`}
                              >
                                <span className="text-sm font-bold tabular-nums leading-none">{count}</span>
                                <span className="text-[10px] opacity-70 mt-0.5 leading-none">
                                  {count === 1 ? 'kort' : count < 5 ? 'korty' : 'kortów'}
                                </span>
                                {courtType && (
                                  <span className="mt-1">
                                    <CourtTypeBadge type={courtType} />
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {modal && <SlotModal slots={modal} onClose={() => setModal(null)} />}
    </>
  );
}
