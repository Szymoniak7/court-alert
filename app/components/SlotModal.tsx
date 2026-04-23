'use client';

import { useEffect } from 'react';
import { TimeSlot } from '@/lib/types';
import { CLUB_COLORS } from './colors';

interface Props {
  slots: TimeSlot[];
  onClose: () => void;
}

export default function SlotModal({ slots, onClose }: Props) {
  const first = slots[0];
  const color = CLUB_COLORS[first.clubId];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Group by duration, sorted ascending
  const byDuration = slots.reduce<Record<number, TimeSlot[]>>((acc, slot) => {
    if (!acc[slot.duration]) acc[slot.duration] = [];
    acc[slot.duration].push(slot);
    return acc;
  }, {});
  const durations = Object.keys(byDuration).map(Number).sort((a, b) => a - b);

  // Count unique courts
  const uniqueCourts = new Set(slots.map((s) => s.courtId)).size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-modal-backdrop"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-[3px] h-5 rounded-full flex-shrink-0"
                style={{ background: color?.hex ?? '#6b7280' }}
              />
              <span className="font-semibold text-white">{first.clubName}</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition text-xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums">
            {first.startTime}
            <span className="text-base font-normal text-gray-400 ml-2">
              {first.date.slice(8)}.{first.date.slice(5, 7)}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {uniqueCourts} {uniqueCourts === 1 ? 'kort' : uniqueCourts < 5 ? 'korty' : 'kortów'} · {durations.join(', ')} min
          </p>
        </div>

        {/* Slots grouped by duration */}
        <div className="px-5 py-3 space-y-4 max-h-80 overflow-y-auto">
          {durations.map((duration) => (
            <div key={duration}>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                {duration} min · do {byDuration[duration][0].endTime}
              </p>
              <div className="space-y-1.5">
                {byDuration[duration].map((slot, i) => (
                  <a
                    key={i}
                    href={slot.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-700 active:scale-[0.98] transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{slot.courtName}</p>
                        {slot.courtType && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                            slot.courtType === 'indoor'
                              ? 'bg-blue-900/60 text-blue-300'
                              : 'bg-amber-900/60 text-amber-300'
                          }`}>
                            {slot.courtType === 'indoor' ? 'indoor' : 'outdoor'}
                          </span>
                        )}
                      </div>
                      {slot.price && (
                        <p className="text-xs text-gray-400 mt-0.5">{slot.price}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition">
                      Rezerwuj →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-4 pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
