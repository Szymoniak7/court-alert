import { TimeSlot } from '@/lib/types';

export function getCourtType(slots: TimeSlot[]): 'indoor' | 'outdoor' | 'both' | null {
  let hasIndoor = false, hasOutdoor = false;
  for (const s of slots) {
    if (s.courtType === 'indoor') hasIndoor = true;
    else if (s.courtType === 'outdoor') hasOutdoor = true;
    if (hasIndoor && hasOutdoor) return 'both';
  }
  if (hasIndoor) return 'indoor';
  if (hasOutdoor) return 'outdoor';
  return null;
}

export function CourtTypeBadge({ type, className }: { type: 'indoor' | 'outdoor' | 'both'; className?: string }) {
  const base = 'text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap';
  if (type === 'indoor') {
    return <span className={`${base} bg-blue-900/50 text-blue-300 ${className ?? ''}`}>Indoor</span>;
  }
  if (type === 'outdoor') {
    return <span className={`${base} bg-amber-900/50 text-amber-300 ${className ?? ''}`}>Outdoor</span>;
  }
  return (
    <span className={`flex items-center gap-0.5 ${className ?? ''}`}>
      <span className={`${base} bg-blue-900/50 text-blue-300`}>In</span>
      <span className={`${base} bg-amber-900/50 text-amber-300`}>Out</span>
    </span>
  );
}
