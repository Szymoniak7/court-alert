import * as cheerio from 'cheerio';
import { createClient } from 'redis';
import { TimeSlot } from '../types';
import { calculateKlubyPrice } from '../pricing';

const KLUBY_BASE = 'https://kluby.org';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 2000 },
    });
    redisClient.on('error', (e) => console.error('Redis error:', e));
    await redisClient.connect();
  }
  return redisClient;
}

// Clubs that use the public /slug/grafik URL (general login, not dedykowane)
const PUBLIC_GRAFIK_SLUGS = new Set(['toro-padel', 'propadel']);

function getGrafikUrl(slug: string, date: string): string {
  if (PUBLIC_GRAFIK_SLUGS.has(slug)) {
    return `${KLUBY_BASE}/${slug}/grafik?data_grafiku=${date}&dyscyplina=4`;
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

async function loginKlubyDedicated(slug: string): Promise<string> {
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

  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (!setCookies.length) throw new Error(`Login failed for ${slug} — no cookies returned`);
  return setCookies.map((c) => c.split(';')[0]).join('; ');
}

async function loginKlubyGeneral(): Promise<string> {
  const email = process.env.KLUBY_EMAIL;
  const password = process.env.KLUBY_PASSWORD;
  if (!email || !password) throw new Error('KLUBY_EMAIL / KLUBY_PASSWORD not set');

  const loginUrl = `${KLUBY_BASE}/logowanie`;
  const body = new URLSearchParams({
    konto: email,
    haslo: password,
    remember: '1',
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

  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (!setCookies.length) throw new Error('General kluby.org login failed — no cookies returned');
  return setCookies.map((c) => c.split(';')[0]).join('; ');
}

async function getSession(slug: string): Promise<string> {
  const isPublic = PUBLIC_GRAFIK_SLUGS.has(slug);
  const key = isPublic ? 'kluby:session:general' : `kluby:session:${slug}`;
  try {
    const redis = await getRedis();
    const cached = await redis.get(key);
    if (cached) return cached;

    const cookies = isPublic ? await loginKlubyGeneral() : await loginKlubyDedicated(slug);
    await redis.set(key, cookies, { EX: 23 * 60 * 60 }); // 23h TTL
    return cookies;
  } catch (e) {
    console.error('Redis getSession error:', e);
    return isPublic ? loginKlubyGeneral() : loginKlubyDedicated(slug);
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

interface CellData {
  free: boolean;
  href: string;
  courtId: string;
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

  // Pass 1: build full grid (time × column → free/reserved)
  // grid[timeIdx][colIdx] — colIdx 0 = first court (after time column)
  const times: string[] = [];
  const grid: (CellData | null)[][] = [];
  const rowspanMap: Record<number, { remaining: number; data: CellData | null }> = {};

  table.find('tr').each((rowIdx, row) => {
    if (rowIdx === 0) return;
    const tds = $(row).find('td');
    if (!tds.length) return;

    const rawTime = tds.first().text().trim();
    if (!rawTime.match(/^\d{1,2}:\d{2}$/)) return;

    const startTime = padTime(rawTime);
    times.push(startTime);
    const rowData: (CellData | null)[] = [];
    let realColIndex = 1;

    tds.each((i, td) => {
      if (i === 0) return;

      // Fill columns covered by a previous rowspan
      while (rowspanMap[realColIndex]?.remaining > 0) {
        rowData.push(rowspanMap[realColIndex].data);
        rowspanMap[realColIndex].remaining--;
        realColIndex++;
      }

      const el = $(td);
      const rowspan = parseInt(el.attr('rowspan') || '1');

      // Only treat as free if the link text says "Rezerwuj"
      const link = el.find('a[href*="/rezerwuj/"]').filter(
        (_, a) => /rezerwuj/i.test($(a).text())
      );

      let cellData: CellData | null = null;
      if (link.length) {
        const href = link.attr('href') || '';
        const urlParts = href.split('/');
        const courtId = urlParts[urlParts.length - 2] || String(realColIndex);
        cellData = { free: true, href, courtId };
      }

      if (rowspan > 1) {
        rowspanMap[realColIndex] = { remaining: rowspan - 1, data: cellData };
      }

      rowData.push(cellData);
      realColIndex++;
    });

    // Fill any remaining columns still covered by rowspan
    const maxCols = courtNames.length - 1;
    while (realColIndex <= maxCols) {
      if (rowspanMap[realColIndex]?.remaining > 0) {
        rowData.push(rowspanMap[realColIndex].data);
        rowspanMap[realColIndex].remaining--;
      } else {
        rowData.push(null);
      }
      realColIndex++;
    }

    grid.push(rowData);
  });

  // Pass 2: for each free cell, compute real duration (30 min × consecutive free rows)
  // and emit one slot per starting 30-min window
  const numCols = courtNames.length - 1;

  for (let colIdx = 0; colIdx < numCols; colIdx++) {
    const courtName = courtNames[colIdx + 1] || `Kort ${colIdx + 1}`;
    const nameLower = courtName.toLowerCase();
    let courtType: 'indoor' | 'outdoor' | undefined =
      nameLower.includes('zewn') || nameLower.includes('outdoor') || nameLower.includes('open')
        ? 'outdoor'
        : nameLower.includes('kryt') || nameLower.includes('indoor') || nameLower.includes('wewn')
        ? 'indoor'
        : undefined;

    if (clubId === 'padlovnia' && courtType === undefined) {
      const num = parseInt(courtName.match(/\d+/)?.[0] || '0');
      if (num >= 1 && num <= 7) courtType = 'indoor';
      else if (num >= 8 && num <= 11) courtType = 'outdoor';
    }

    for (let timeIdx = 0; timeIdx < times.length; timeIdx++) {
      const cell = grid[timeIdx]?.[colIdx];
      if (!cell?.free) continue;

      // Count how many consecutive 30-min slots are free from here
      let freeCount = 1;
      while (
        timeIdx + freeCount < times.length &&
        grid[timeIdx + freeCount]?.[colIdx]?.free
      ) {
        freeCount++;
      }

      const rawDuration = freeCount * 30;
      // Skip slots shorter than 1h (not bookable for padel)
      if (rawDuration < 60) continue;
      // Cap at 2h — standard padel booking range is 1h / 1.5h / 2h
      const duration = Math.min(rawDuration, 120);
      const startTime = times[timeIdx];
      const endTime = addMinutes(startTime, duration);

      slots.push({
        courtId: cell.courtId,
        courtName,
        clubId,
        clubName,
        date,
        startTime,
        endTime,
        duration,
        bookingUrl: `${KLUBY_BASE}${cell.href}`,
        courtType,
      });
    }
  }

  return slots;
}

export async function fetchKlubySlots(
  clubId: string,
  clubName: string,
  slug: string,
  date: string,
  defaultCourtType?: 'indoor' | 'outdoor',
): Promise<TimeSlot[]> {
  const html = await fetchHtml(getGrafikUrl(slug, date));
  const slots = parseGrafikHtml(html, clubId, clubName, slug, date);
  return slots.map((s) => {
    const courtType = s.courtType ?? defaultCourtType;
    return { ...s, courtType, price: s.price ?? calculateKlubyPrice(clubId, s.startTime, s.date, s.duration, courtType) };
  });
}

function isSessionExpired(html: string, slug: string): boolean {
  if (PUBLIC_GRAFIK_SLUGS.has(slug)) {
    return html.includes(`/logowanie?page=/${slug}/`);
  }
  return html.includes('Musisz być zalogowany');
}

export async function fetchKlubyAuthSlots(
  clubId: string,
  clubName: string,
  slug: string,
  date: string,
  defaultCourtType?: 'indoor' | 'outdoor',
): Promise<TimeSlot[]> {
  const isPublic = PUBLIC_GRAFIK_SLUGS.has(slug);
  const redisKey = isPublic ? 'kluby:session:general' : `kluby:session:${slug}`;

  let cookies = await getSession(slug);
  const url = getGrafikUrl(slug, date);
  let html = await fetchHtml(url, cookies);

  // If session expired, clear Redis and re-login once
  if (isSessionExpired(html, slug)) {
    try {
      const redis = await getRedis();
      await redis.del(redisKey);
    } catch (e) {
      console.error('Redis del error:', e);
    }
    cookies = isPublic ? await loginKlubyGeneral() : await loginKlubyDedicated(slug);
    html = await fetchHtml(url, cookies);
  }

  if (isSessionExpired(html, slug)) {
    throw new Error(`Auth failed for ${slug}`);
  }

  const slots = parseGrafikHtml(html, clubId, clubName, slug, date);
  return slots.map((s) => {
    const courtType = s.courtType ?? defaultCourtType;
    return { ...s, courtType, price: s.price ?? calculateKlubyPrice(clubId, s.startTime, s.date, s.duration, courtType) };
  });
}
