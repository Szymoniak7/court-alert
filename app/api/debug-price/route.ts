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

    // Return first 3000 chars of HTML to analyze structure
    return NextResponse.json({
      cookieCount: cookies.split(';').length,
      slotUrl,
      htmlPreview: slotHtml.slice(0, 3000),
      containsPLN: slotHtml.includes('PLN'),
      containsZl: slotHtml.toLowerCase().includes('zł'),
      containsCena: slotHtml.toLowerCase().includes('cena'),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
