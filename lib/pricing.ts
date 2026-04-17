// Dynamiczny cennik dla klubów z kluby.org
// Źródło: strony internetowe klubów (sprawdzone 18.04.2026)

interface PriceTier {
  hourlyRate: number;   // PLN/h
  // Warunki: brak = zawsze ta stawka
  weekdayOnly?: boolean;   // pn-pt
  weekendOnly?: boolean;   // sb-nd
  fromHour?: number;       // >= ta godzina
  toHour?: number;         // < ta godzina
}

interface ClubPricing {
  tiers: PriceTier[];
  defaultHourlyRate: number;
}

const PRICING: Record<string, ClubPricing> = {
  'loba-padel': {
    // https://lobapadel.pl/cennik-za-korty
    // Best deal: pn-pt 06-16: 120 PLN/h
    // Prime Time: pn-pt 16-22 + weekendy: 200 PLN/h
    // Nocne granie: pn-pt 22-00: 140 PLN/h
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
    // Standard: pn-pt 00-16: 140 PLN/h (jednorazowa)
    // Prime: pn-pt 16-22:30 + weekendy: 200 PLN/h (jednorazowa)
    defaultHourlyRate: 200,
    tiers: [
      { hourlyRate: 140, weekdayOnly: true, fromHour: 0,  toHour: 16 },
      { hourlyRate: 200, weekdayOnly: true, fromHour: 16, toHour: 24 },
      { hourlyRate: 200, weekendOnly: true },
    ],
  },
  'toro-padel': {
    // https://toropadel.pl/cennik
    // Pn-pt 07-16: 140 PLN/h
    // Pn-pt 16-23: 192 PLN/h
    // Weekend: 192 PLN/h
    defaultHourlyRate: 192,
    tiers: [
      { hourlyRate: 140, weekdayOnly: true, fromHour: 7,  toHour: 16 },
      { hourlyRate: 192, weekdayOnly: true, fromHour: 16, toHour: 23 },
      { hourlyRate: 192, weekendOnly: true },
    ],
  },
};

export function calculateKlubyPrice(clubId: string, startTime: string, date: string, durationMinutes: number): string | undefined {
  const pricing = PRICING[clubId];
  if (!pricing) return undefined;

  const [h] = startTime.split(':').map(Number);
  const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // 0=nd, 6=sb
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isWeekday = !isWeekend;

  let hourlyRate = pricing.defaultHourlyRate;

  for (const tier of pricing.tiers) {
    if (tier.weekdayOnly && !isWeekday) continue;
    if (tier.weekendOnly && !isWeekend) continue;
    if (tier.fromHour !== undefined && h < tier.fromHour) continue;
    if (tier.toHour !== undefined && h >= tier.toHour) continue;
    hourlyRate = tier.hourlyRate;
    break;
  }

  const price = Math.round(hourlyRate * durationMinutes / 60);
  return `${price} PLN`;
}
