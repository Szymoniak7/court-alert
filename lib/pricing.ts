// Dynamiczny cennik dla klubów z kluby.org
// Źródło: strony internetowe klubów (sprawdzone 18.04.2026)

interface PriceTier {
  hourlyRate: number;   // PLN/h
  weekdayOnly?: boolean;
  weekendOnly?: boolean;
  fromHour?: number;
  toHour?: number;
}

interface ClubPricing {
  tiers: PriceTier[];
  defaultHourlyRate: number;
  // Osobny cennik dla outdoor (jeśli różny)
  outdoorTiers?: PriceTier[];
  outdoorDefaultHourlyRate?: number;
}

const PRICING: Record<string, ClubPricing> = {
  'loba-padel': {
    // https://lobapadel.pl/cennik-za-korty
    defaultHourlyRate: 200,
    tiers: [
      { hourlyRate: 120, weekdayOnly: true, fromHour: 6,  toHour: 16 },
      { hourlyRate: 140, weekdayOnly: true, fromHour: 22, toHour: 24 },
      { hourlyRate: 200, weekdayOnly: true, fromHour: 16, toHour: 22 },
      { hourlyRate: 200, weekendOnly: true },
    ],
  },
  'mana-padel': {
    // https://manapadel.pl/cennik
    defaultHourlyRate: 200,
    tiers: [
      { hourlyRate: 140, weekdayOnly: true, fromHour: 0,  toHour: 16 },
      { hourlyRate: 200, weekdayOnly: true, fromHour: 16, toHour: 24 },
      { hourlyRate: 200, weekendOnly: true },
    ],
  },
  'toro-padel': {
    // https://toropadel.pl/cennik
    defaultHourlyRate: 192,
    tiers: [
      { hourlyRate: 140, weekdayOnly: true, fromHour: 7,  toHour: 16 },
      { hourlyRate: 192, weekdayOnly: true, fromHour: 16, toHour: 23 },
      { hourlyRate: 192, weekendOnly: true },
    ],
  },
  'mera': {
    // https://kluby.org/mera — cennik padel: pn-nd cały dzień 110 PLN/h (ważny do 30.04.2026)
    defaultHourlyRate: 110,
    tiers: [
      { hourlyRate: 110 },
    ],
  },
  'sporteum': {
    // https://sporteum.pl/padel/ — off-peak pn-pt 8-15: 110, peak 15-23 + weekend: 130
    defaultHourlyRate: 130,
    tiers: [
      { hourlyRate: 110, weekdayOnly: true, fromHour: 8, toHour: 15 },
      { hourlyRate: 130, weekdayOnly: true, fromHour: 15, toHour: 23 },
      { hourlyRate: 130, weekendOnly: true },
    ],
  },
  'miedzeszyn': {
    // https://www.klubmiedzeszyn.pl/padel — pn-pt 8-16: 120, 16-22: 160 / weekend 8-22: 160
    defaultHourlyRate: 160,
    tiers: [
      { hourlyRate: 120, weekdayOnly: true, fromHour: 8,  toHour: 16 },
      { hourlyRate: 160, weekdayOnly: true, fromHour: 16, toHour: 22 },
      { hourlyRate: 160, weekendOnly: true },
    ],
  },
  'teniswil': {
    // https://teniswil.pl/padel/ — pn-pt 7-16: 80, 16-22: 100 / weekend: 100
    defaultHourlyRate: 100,
    tiers: [
      { hourlyRate: 80,  weekdayOnly: true, fromHour: 7,  toHour: 16 },
      { hourlyRate: 100, weekdayOnly: true, fromHour: 16, toHour: 22 },
      { hourlyRate: 100, weekendOnly: true },
    ],
  },
  'tenes': {
    // https://tenes.pl — happy hours pn-pt 7-15 + weekend 19-23: 90 / prime time: 110
    defaultHourlyRate: 110,
    tiers: [
      { hourlyRate: 90,  weekdayOnly: true, fromHour: 7,  toHour: 15 },
      { hourlyRate: 110, weekdayOnly: true, fromHour: 15, toHour: 23 },
      { hourlyRate: 90,  weekendOnly: true, fromHour: 19, toHour: 23 },
      { hourlyRate: 110, weekendOnly: true, fromHour: 7,  toHour: 19 },
    ],
  },
  'padlovnia': {
    // https://padlovnia.pl — cennik zimowy 2025-2026
    // Indoor: pn-pt 07-16: 140, 16-24: 180 / weekend: 180
    // Outdoor: pn-pt 07-16: 120, 16-24: 140 / weekend: 100
    defaultHourlyRate: 180,
    tiers: [
      { hourlyRate: 140, weekdayOnly: true, fromHour: 7,  toHour: 16 },
      { hourlyRate: 180, weekdayOnly: true, fromHour: 16, toHour: 24 },
      { hourlyRate: 180, weekendOnly: true },
    ],
    outdoorDefaultHourlyRate: 140,
    outdoorTiers: [
      { hourlyRate: 120, weekdayOnly: true, fromHour: 7,  toHour: 16 },
      { hourlyRate: 140, weekdayOnly: true, fromHour: 16, toHour: 24 },
      { hourlyRate: 100, weekendOnly: true },
    ],
  },
};

function applyTiers(tiers: PriceTier[], defaultRate: number, h: number, isWeekday: boolean, isWeekend: boolean): number {
  for (const tier of tiers) {
    if (tier.weekdayOnly && !isWeekday) continue;
    if (tier.weekendOnly && !isWeekend) continue;
    if (tier.fromHour !== undefined && h < tier.fromHour) continue;
    if (tier.toHour !== undefined && h >= tier.toHour) continue;
    return tier.hourlyRate;
  }
  return defaultRate;
}

export function calculateKlubyPrice(
  clubId: string,
  startTime: string,
  date: string,
  durationMinutes: number,
  courtType?: 'indoor' | 'outdoor',
): string | undefined {
  const pricing = PRICING[clubId];
  if (!pricing) return undefined;

  const [h] = startTime.split(':').map(Number);
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isWeekday = !isWeekend;

  let hourlyRate: number;
  if (courtType === 'outdoor' && pricing.outdoorTiers) {
    hourlyRate = applyTiers(pricing.outdoorTiers, pricing.outdoorDefaultHourlyRate!, h, isWeekday, isWeekend);
  } else {
    hourlyRate = applyTiers(pricing.tiers, pricing.defaultHourlyRate, h, isWeekday, isWeekend);
  }

  return `${Math.round(hourlyRate * durationMinutes / 60)} PLN`;
}
