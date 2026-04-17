import * as cheerio from 'cheerio';
import { createClient } from 'redis';
import { TimeSlot } from '../types';

const KLUBY_BASE = 'https://kluby.org';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (e) => console.error('Redis error:', e));
    await redisClient.connect();
  }
  return redisClient;
}

function getGrafikUrl(slug: string, date: string): string {
  if (slug === 'toro-padel') {
    return `${KLUBY_BASE}/toro-padel/grafik?data_grafiku=${date}&dyscyplina=4`;
  }
  return `${KLUBY_BASE}/klub/${slug}/dedykowane/grafik?data_grafiku=${date}&dyscyplina=4`;
}

function padTime(t: string): string {
  return t.includes(':') && t.indexOf(':') < 2 ? '0' + t : t;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

async function loginKluby(slug: string): Promise<string> {
  const email = process.env.KLUBY_EMAIL;
  const password = process.env.KLUBY_PASSWORD;
  if (!email || !password) throw new Error('KLUBY_EMAIL / KLUBY_PASSWORD not set');

  const loginUrl = `${KLUBY_BASE}/klub/${slug}/dedykowane/logowanie`;

  const body = new URLSearchParams({
    konto: email,
    haslo: password,
    remember: '1',
    page: `/klub/${slug}/dedykowane`,
    logowanie_dedykowane: '1',
    logowanie: '1',
  });

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA,
      Referer: loginUrl,
      Origin: KLUBY_BASE,
    },
    body: body.toString(),
    redirect: 'manual',
  });

  // Collect Set-Cookie headers
  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (!setCookies.length) throw new Error(`Login failed for ${slug} — no cookies returned`);

  // Parse into "name=value" pairs
  const cookies = setCookies
    .map((c) => c.split(';')[0])
    .join('; ');

  return cookies;
}

async function getSession(slug: string): Promise<string> {
  const key = `kluby:session:${slug}`;
  try {
    const redis = await getRedis();
    const cached = await redis.get(key);
    if (cached) return cached;

    const cookies = await loginKluby(slug);
    await redis.set(key, cookies, { EX: 23 * 60 * 60 }); // 23h TTL
    return cookies;
  } catch (e) {
    // Redis unavailable — fall back to fresh login without caching
    console.error('Redis getSession error:', e);
    return loginKluby(slug);
  }
}

async function fetchHtml(url: string, cookies?: string): Promise<string> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        ...(cookies ? { Cookie: cookies } : {}),
      },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseGrafikHtml(
  html: string,
  clubId: string,
  clubName: string,
  _slug: string,
  date: string
): TimeSlot[] {
  const $ = cheerio.load(html);
  const slots: TimeSlot[] = [];

  const table = $('table').filter((_, el) =>
    $(el).find('a[href*="/rezerwuj/"]').length > 0
  ).first();

  if (!table.length) return slots;

  const courtNames: string[] = [];
  table.find('tr').first().find('th, td').each((_, el) => {
    const words = $(el).text().replace(/\s+/g, ' ').trim().split(' ');
    courtNames.push(words.slice(0, 2).join(' ') || 'Kort');
  });

  const rowspanMap: Record<number, number> = {};

  table.find('tr').each((rowIdx, row) => {
    if (rowIdx === 0) return;
    const tds = $(row).find('td');
    if (!tds.length) return;

    const rawTime = tds.first().text().trim();
    if (!rawTime.match(/^\d{1,2}:\d{2}$/)) return;

    const startTime = padTime(rawTime);
    const endTime = addMinutes(startTime, 90);
    let realColIndex = 1;

    tds.each((i, td) => {
      if (i === 0) return;
      while (rowspanMap[realColIndex] > 0) {
        rowspanMap[realColIndex]--;
        realColIndex++;
      }
      const el = $(td);
      const rowspan = parseInt(el.attr('rowspan') || '1');
      if (rowspan > 1) rowspanMap[realColIndex] = rowspan - 1;

      const link = el.find('a[href*="/rezerwuj/"]');
      if (link.length) {
        const href = link.attr('href') || '';
        const urlParts = href.split('/');
        const courtId = urlParts[urlParts.length - 2] || String(realColIndex);
        const courtName = courtNames[realColIndex] || `Kort ${realColIndex}`;
        slots.push({
          courtId,
          courtName,
          clubId,
          clubName,
          date,
          startTime,
          endTime,
          duration: 90,
          bookingUrl: `${KLUBY_BASE}${href}`,
        });
      }
      realColIndex++;
    });
  });

  return slots;
}

async function fetchSlotPrice(bookingUrl: string, cookies: string): Promise<string | undefined> {
  try {
    const html = await fetchHtml(bookingUrl, cookies);
    const $ = cheerio.load(html);

    // Szukaj ceny w różnych miejscach
    const candidates: string[] = [];

    // Elementy z "cena" lub "price" w klasie/id
    $('[class*="cena"],[id*="cena"],[class*="price"],[id*="price"],[class*="koszt"],[id*="koszt"]').each((_, el) => {
      candidates.push($(el).text());
    });

    // Hidden inputs
    $('input[name="cena"],input[name="price"],input[name="kwota"]').each((_, el) => {
      candidates.push($(el).val() as string || '');
    });

    // Cały tekst strony — szukaj wzorca X PLN lub X zł
    const bodyText = $('body').text();
    candidates.push(bodyText);

    for (const text of candidates) {
      const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:PLN|zł)/i);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (val > 0 && val < 5000) return `${Math.round(val)} PLN`;
      }
    }
  } catch (e) {
    console.error('fetchSlotPrice error:', e);
  }
  return undefined;
}

async function enrichWithPrices(slots: TimeSlot[], slug: string): Promise<TimeSlot[]> {
  // Toro nie ma dedykowanego portalu — nie możemy się zalogować
  if (slug === 'toro-padel') return slots;

  let cookies: string;
  try {
    cookies = await getSession(slug);
  } catch (e) {
    console.error(`enrichWithPrices: login failed for ${slug}:`, e);
    return slots;
  }

  // Unikalne courtId — jedna cena per court (cache w Redis 12h)
  const courtIds = [...new Set(slots.map((s) => s.courtId))];
  const priceMap: Record<string, string | undefined> = {};

  await Promise.all(
    courtIds.map(async (courtId) => {
      const cacheKey = `kluby:price:${slug}:${courtId}`;
      try {
        const redis = await getRedis();
        const cached = await redis.get(cacheKey);
        if (cached) {
          priceMap[courtId] = cached === 'null' ? undefined : cached;
          return;
        }
      } catch (_) { /* Redis unavailable */ }

      // Weź pierwszy slot dla tego courtu i pobierz cenę
      const sample = slots.find((s) => s.courtId === courtId);
      if (!sample?.bookingUrl) return;

      const price = await fetchSlotPrice(sample.bookingUrl, cookies);
      priceMap[courtId] = price;

      try {
        const redis = await getRedis();
        await redis.set(cacheKey, price ?? 'null', { EX: 12 * 60 * 60 });
      } catch (_) { /* Redis unavailable */ }
    })
  );

  return slots.map((s) => ({
    ...s,
    price: priceMap[s.courtId] ?? s.price,
  }));
}

export async function fetchKlubySlots(
  clubId: string,
  clubName: string,
  slug: string,
  date: string
): Promise<TimeSlot[]> {
  const html = await fetchHtml(getGrafikUrl(slug, date));
  const slots = parseGrafikHtml(html, clubId, clubName, slug, date);
  return enrichWithPrices(slots, slug);
}

export async function fetchKlubyAuthSlots(
  clubId: string,
  clubName: string,
  slug: string,
  date: string
): Promise<TimeSlot[]> {
  let cookies = await getSession(slug);
  const url = getGrafikUrl(slug, date);
  let html = await fetchHtml(url, cookies);

  // If session expired, clear Redis and re-login once
  if (html.includes('Musisz być zalogowany')) {
    try {
      const redis = await getRedis();
      await redis.del(`kluby:session:${slug}`);
    } catch (e) {
      console.error('Redis del error:', e);
    }
    cookies = await loginKluby(slug);
    html = await fetchHtml(url, cookies);
  }

  if (html.includes('Musisz być zalogowany')) {
    throw new Error(`Auth failed for ${slug}`);
  }

  return parseGrafikHtml(html, clubId, clubName, slug, date);
}
