export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export const SHORT_DAYS = ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
const PL_DAYS = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

// Quick semantic presets shown as chips
export const DAY_PRESETS = [
  { id: 'today',   label: 'Dziś' },
  { id: 'next3',   label: '3 dni' },
  { id: 'weekend', label: 'Weekend' },
] as const;

export type DayPresetId = 'today' | 'next3' | 'weekend';
export const DAY_PRESET_IDS: string[] = ['today', 'next3', 'weekend'];

// Time presets — single-select
export interface TimePreset {
  id: string;
  label: string;
  sublabel: string;
  fromHour: number;
  toHour: number;
}

export const TIME_PRESETS: TimePreset[] = [
  { id: 'morning',   label: 'Rano',     sublabel: '8–12',  fromHour: 8,  toHour: 12 },
  { id: 'midday',    label: 'Południe', sublabel: '12–17', fromHour: 12, toHour: 17 },
  { id: 'afterwork', label: 'Po pracy', sublabel: '17–21', fromHour: 17, toHour: 21 },
  { id: 'evening',   label: 'Wieczór',  sublabel: '21–24', fromHour: 21, toHour: 24 },
];

// Returns next n days as YYYY-MM-DD strings starting from today
export function getNextDays(n: number): string[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => formatDate(addDays(today, i)));
}

// "Śr 23" format for date chips
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()}`;
}

// Display label for the selected day (preset or specific date)
export function getDayLabel(dayId: string): string {
  if (dayId === 'today') return 'Dziś';
  if (dayId === 'next3') return 'Najbliższe 3 dni';
  if (dayId === 'weekend') return 'Weekend';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayId)) return formatDatePL(dayId);
  return 'Dziś';
}

export function getDates(dayId: string): string[] {
  const today = new Date();

  if (dayId === 'today') return [formatDate(today)];

  if (dayId === 'next3') return [0, 1, 2].map((i) => formatDate(addDays(today, i)));

  if (dayId === 'weekend') {
    const day = today.getDay(); // 0=Sun, 6=Sat
    if (day === 6) return [formatDate(today), formatDate(addDays(today, 1))];
    if (day === 0) return [formatDate(today)];
    const toSat = 6 - day;
    return [formatDate(addDays(today, toSat)), formatDate(addDays(today, toSat + 1))];
  }

  // Specific date string (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayId)) return [dayId];

  // Fallback
  return [formatDate(today)];
}

export function formatDatePL(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${PL_DAYS[d.getDay()]} ${day}.${String(month).padStart(2, '0')}`;
}
