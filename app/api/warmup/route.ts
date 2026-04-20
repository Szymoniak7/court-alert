import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Called by Vercel cron every 5 minutes to prevent cold starts.
// Triggers a real availability fetch to warm up modules + Redis connection.
export async function GET(req: Request) {
  const host = req.headers.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });

  try {
    await fetch(`${proto}://${host}/api/availability?dates=${today}&from=17&to=22`, {
      cache: 'no-store',
    });
  } catch (_) {
    // ignore — warmup is best-effort
  }

  return NextResponse.json({ ok: true });
}
