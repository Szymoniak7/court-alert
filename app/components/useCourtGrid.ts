import { useMemo } from 'react';
import { TimeSlot } from '@/lib/types';

export function useCourtGrid(slots: TimeSlot[]) {
  return useMemo(() => {
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
}
