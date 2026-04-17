import { TimeSlot } from '../types';

const API_BASE = 'https://api.playtomic.io/v1';

// Cache court names per tenant
const courtNameCache: Record<string, Record<string, string>> = {};

interface CourtInfo {
  name: string;
  courtType?: 'indoor' | 'outdoor';
}

const courtInfoCache: Record<string, Record<string, CourtInfo>> = {};

async function getCourtInfo(tenantId: string): Promise<Record<string, CourtInfo>> {
  if (courtInfoCache[tenantId]) return courtInfoCache[tenantId];

  try {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<string, CourtInfo> = {};
    for (const r of data.resources || []) {
      if (r.resource_id && r.name) {
        const rt = r.properties?.resource_type;
        map[r.resource_id] = {
          name: r.name.trim(),
          courtType: rt === 'indoor' || rt === 'outdoor' ? rt : undefined,
        };
      }
    }
    courtInfoCache[tenantId] = map;
    return map;
  } catch {
    return {};
  }
}

interface PlaytomicResource {
  resource_id: string;
  start_date: string;
  slots: Array<{
    start_time: string; // "HH:MM:SS"
    duration: number;   // minutes
    price?: string;
  }>;
}

export async function fetchPlaytomicSlots(
  clubId: string,
  clubName: string,
  tenantId: string,
  date: string,
  playtomicSlug?: string,
): Promise<TimeSlot[]> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);

  let courtInfo: Record<string, CourtInfo>;
  let availRes: Response;
  try {
    [courtInfo, availRes] = await Promise.all([
      getCourtInfo(tenantId),
      fetch(
        `${API_BASE}/availability?user_id=me&sport_id=PADEL` +
          `&start_min=${date}T00:00:00&start_max=${date}T23:59:59` +
          `&tenant_id=${tenantId}`,
        { cache: 'no-store', signal: ctrl.signal }
      ),
    ]);
  } finally {
    clearTimeout(timeout);
  }

  if (!availRes.ok) {
    throw new Error(`Playtomic fetch failed for ${clubId}: HTTP ${availRes.status}`);
  }

  const data: PlaytomicResource[] = await availRes.json();
  const slots: TimeSlot[] = [];

  for (const resource of data) {
    const info = courtInfo[resource.resource_id];
    const courtName = info?.name || `Kort`;
    const courtType = info?.courtType;

    for (const slot of resource.slots) {
      // API returns start_time in UTC — convert to Europe/Warsaw local time
      const utcDatetime = new Date(`${resource.start_date}T${slot.start_time}Z`);
      const startTime = utcDatetime.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Warsaw',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }); // "HH:MM"
      const slotDate = utcDatetime.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' }); // "YYYY-MM-DD"

      const [h, m] = startTime.split(':').map(Number);
      const endMinutes = h * 60 + m + slot.duration;
      const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

      slots.push({
        courtId: resource.resource_id,
        courtName,
        clubId,
        clubName,
        date: slotDate,
        startTime,
        endTime,
        duration: slot.duration,
        price: slot.price ?? undefined,
        bookingUrl: `https://playtomic.io/clubs/${playtomicSlug || clubId}?sport=PADEL&date=${slotDate}`,
        courtType,
      });
    }
  }

  return slots;
}
