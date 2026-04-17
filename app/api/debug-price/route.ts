import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KLUBY_BASE = 'https://kluby.org';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function loginLoba(): Promise<string> {
  const email = process.env.KLUBY_EMAIL;
  const password = process.env.KLUBY_PASSWORD;
  const slug = 'loba-padel';
  const loginUrl = `${KLUBY_BASE}/klub/${slug}/dedykowane/logowanie`;

  const body = new URLSearchParams({
    konto: email!,
    haslo: password!,
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
  const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');
  return cookies;
}

export async function GET() {
  try {
    // 1. Login
    const cookies = await loginLoba();

    // 2. Fetch grafik to get a sample slot URL
    const grafikUrl = `${KLUBY_BASE}/klub/loba-padel/dedykowane/grafik?data_grafiku=2026-04-19&dyscyplina=4`;
    const grafikRes = await fetch(grafikUrl, {
      headers: { 'User-Agent': UA, Cookie: cookies },
      cache: 'no-store',
    });
    const grafikHtml = await grafikRes.text();

    // Find first /rezerwuj/ link
    const match = grafikHtml.match(/href="([^"]*\/rezerwuj\/[^"]*)"/);
    const slotPath = match?.[1];

    if (!slotPath) {
      return NextResponse.json({ error: 'No rezerwuj link found', cookieCount: cookies.split(';').length });
    }

    // 3. Fetch the slot page
    const slotUrl = `${KLUBY_BASE}${slotPath}`;
    const slotRes = await fetch(slotUrl, {
      headers: { 'User-Agent': UA, Cookie: cookies },
      cache: 'no-store',
    });
    const slotHtml = await slotRes.text();

    // Find price-related fragments
    const lower = slotHtml.toLowerCase();
    const plnIdx = slotHtml.indexOf('PLN');
    const zlIdx = lower.indexOf('zł');
    const cenaIdx = lower.indexOf('cena');
    const priceIdx = lower.indexOf('price');

    const snippet = (idx: number) => idx >= 0 ? slotHtml.slice(Math.max(0, idx - 100), idx + 200) : null;

    // Also extract all numbers near PLN/zł
    const priceMatches = [...slotHtml.matchAll(/(\d+[.,]?\d*)\s*(PLN|zł)/gi)].map(m => m[0]);

    return NextResponse.json({
      cookieCount: cookies.split(';').length,
      slotUrl,
      htmlLength: slotHtml.length,
      containsPLN: plnIdx >= 0,
      containsZl: zlIdx >= 0,
      containsCena: cenaIdx >= 0,
      priceMatches,
      snippetPLN: snippet(plnIdx),
      snippetCena: snippet(cenaIdx),
      // Last 2000 chars (price often at bottom)
      htmlTail: slotHtml.slice(-2000),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
