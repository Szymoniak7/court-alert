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
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b border-gray-800`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${color?.dot || 'bg-gray-400'}`} />
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
              {first.date.slice(5).replace('-', '.')}
            </span>
          </p>
        </div>

        {/* Court list */}
        <div className="px-5 py-3 space-y-2 max-h-72 overflow-y-auto">
          {slots.map((slot, i) => (
            <a
              key={i}
              href={slot.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-700 active:scale-[0.98] transition group"
            >
              <div>
                <p className="text-sm font-medium text-white">{slot.courtName}</p>
                <p className="text-xs text-gray-400 mt-0.5">do {slot.endTime} · {slot.duration} min</p>
              </div>
              <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition">
                Rezerwuj →
              </span>
            </a>
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
