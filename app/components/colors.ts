export const CLUB_COLORS: Record<string, {
  dot: string;
  cell1: string;  // 1 slot
  cell2: string;  // 2 slots
  cell3: string;  // 3+ slots
  badge: string;
  header: string;
}> = {
  'loba-padel':        {
    dot: 'bg-emerald-400',
    cell1: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20',
    cell2: 'bg-emerald-500/20 border-emerald-500/35 text-emerald-200 hover:bg-emerald-500/30',
    cell3: 'bg-emerald-500/30 border-emerald-500/50 text-emerald-100 hover:bg-emerald-500/40',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    header: 'text-emerald-400',
  },
  'mana-padel':        {
    dot: 'bg-blue-400',
    cell1: 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20',
    cell2: 'bg-blue-500/20 border-blue-500/35 text-blue-200 hover:bg-blue-500/30',
    cell3: 'bg-blue-500/30 border-blue-500/50 text-blue-100 hover:bg-blue-500/40',
    badge: 'bg-blue-950 text-blue-300 border-blue-800',
    header: 'text-blue-400',
  },
  'toro-padel':        {
    dot: 'bg-orange-400',
    cell1: 'bg-orange-500/10 border-orange-500/20 text-orange-300 hover:bg-orange-500/20',
    cell2: 'bg-orange-500/20 border-orange-500/35 text-orange-200 hover:bg-orange-500/30',
    cell3: 'bg-orange-500/30 border-orange-500/50 text-orange-100 hover:bg-orange-500/40',
    badge: 'bg-orange-950 text-orange-300 border-orange-800',
    header: 'text-orange-400',
  },
  'interpadel':        {
    dot: 'bg-purple-400',
    cell1: 'bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20',
    cell2: 'bg-purple-500/20 border-purple-500/35 text-purple-200 hover:bg-purple-500/30',
    cell3: 'bg-purple-500/30 border-purple-500/50 text-purple-100 hover:bg-purple-500/40',
    badge: 'bg-purple-950 text-purple-300 border-purple-800',
    header: 'text-purple-400',
  },
  'warsaw-padel-club': {
    dot: 'bg-rose-400',
    cell1: 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20',
    cell2: 'bg-rose-500/20 border-rose-500/35 text-rose-200 hover:bg-rose-500/30',
    cell3: 'bg-rose-500/30 border-rose-500/50 text-rose-100 hover:bg-rose-500/40',
    badge: 'bg-rose-950 text-rose-300 border-rose-800',
    header: 'text-rose-400',
  },
  'rqt-sport':         {
    dot: 'bg-yellow-400',
    cell1: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20',
    cell2: 'bg-yellow-500/20 border-yellow-500/35 text-yellow-200 hover:bg-yellow-500/30',
    cell3: 'bg-yellow-500/30 border-yellow-500/50 text-yellow-100 hover:bg-yellow-500/40',
    badge: 'bg-yellow-950 text-yellow-300 border-yellow-800',
    header: 'text-yellow-400',
  },
  'padlovnia':         {
    dot: 'bg-cyan-400',
    cell1: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20',
    cell2: 'bg-cyan-500/20 border-cyan-500/35 text-cyan-200 hover:bg-cyan-500/30',
    cell3: 'bg-cyan-500/30 border-cyan-500/50 text-cyan-100 hover:bg-cyan-500/40',
    badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    header: 'text-cyan-400',
  },
};
