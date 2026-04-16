function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD w local timezone
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

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

export interface DayOption {
  id: string;
  label: string;
  days: number[]; // 0=Sun,1=Mon,...,6=Sat
}

export interface TimeOption {
  id: string;
  label: string;
  sublabel: string;
  fromHour: number;
  toHour: number;
}

export const DAY_OPTIONS: DayOption[] = [
  { id: 'today',    label: 'Dziś',           days: [] },
  { id: 'tomorrow', label: 'Jutro',          days: [] },
  { id: 'weekdays', label: 'Pon–Pt',         days: [1, 2, 3, 4, 5] },
  { id: 'weekend',  label: 'Weekend',        days: [6, 0] },
  { id: 'all',      label: 'Cały tydzień',   days: [0, 1, 2, 3, 4, 5, 6] },
];

export const TIME_OPTIONS: TimeOption[] = [
  { id: 'morning',   label: 'Rano',      sublabel: '6–12',  fromHour: 6,  toHour: 12 },
  { id: 'day',       label: 'W dzień',   sublabel: '12–17', fromHour: 12, toHour: 17 },
  { id: 'afterwork', label: 'Po pracy',  sublabel: '16–22', fromHour: 16, toHour: 22 },
  { id: 'evening',   label: 'Wieczór',   sublabel: '19–24', fromHour: 19, toHour: 24 },
];

export function getDates(dayOptionId: string): string[] {
  if (dayOptionId === 'today') return [formatDate(new Date())];
  if (dayOptionId === 'tomorrow') return [formatDate(addDays(new Date(), 1))];
  const opt = DAY_OPTIONS.find((d) => d.id === dayOptionId)!;
  return nextDays(14, opt.days);
}

const PL_DAYS = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

export function formatDatePL(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${PL_DAYS[d.getDay()]} ${day}.${String(month).padStart(2, '0')}`;
}
