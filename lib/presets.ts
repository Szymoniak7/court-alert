export interface Preset {
  id: string;
  label: string;
  mobileLabel?: string;
  sublabel: string;
  fromHour: number;
  toHour: number; // 24 means midnight
  getDates: () => string[];
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Returns next N days filtered by allowed weekdays (0=Sun,1=Mon,...,6=Sat)
function nextDays(n: number, allowedDays?: number[]): string[] {
  const today = new Date();
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = addDays(today, i);
    if (!allowedDays || allowedDays.includes(d.getDay())) {
      result.push(formatDate(d));
    }
  }
  return result;
}

function thisWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const result: string[] = [];
  for (let i = 0; i <= daysUntilSunday; i++) {
    result.push(formatDate(addDays(today, i)));
  }
  return result;
}

export const PRESETS: Preset[] = [
  {
    id: 'weekday-evening',
    label: 'Wieczory',
    sublabel: 'pon–pt · 17–22',
    fromHour: 17,
    toHour: 22,
    getDates: () => nextDays(7, [1, 2, 3, 4, 5]),
  },
  {
    id: 'weekend-morning',
    label: 'Poranek',
    sublabel: 'sob–niedz · 6–12',
    fromHour: 6,
    toHour: 12,
    getDates: () => nextDays(7, [6, 0]),
  },
  {
    id: 'weekend-day',
    label: 'Dzień',
    sublabel: 'sob–niedz · 12–20',
    fromHour: 12,
    toHour: 20,
    getDates: () => nextDays(7, [6, 0]),
  },
  {
    id: 'weekend-evening',
    label: 'Wieczór',
    sublabel: 'sob–niedz · 20–24',
    fromHour: 20,
    toHour: 24,
    getDates: () => nextDays(7, [6, 0]),
  },
  {
    id: 'this-week',
    label: 'Ten tydzień',
    mobileLabel: 'Tydzień',
    sublabel: 'dziś → niedziela',
    fromHour: 0,
    toHour: 24,
    getDates: thisWeekDates,
  },
];

const PL_DAYS = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const PL_DAYS_SHORT = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];

export function formatDatePL(dateStr: string, short = false): string {
  const d = new Date(dateStr + 'T12:00:00');
  const dayName = short ? PL_DAYS_SHORT[d.getDay()] : PL_DAYS[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${dayName} ${day}.${String(month).padStart(2, '0')}`;
}
