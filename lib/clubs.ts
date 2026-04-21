export type ClubSource = 'kluby' | 'kluby-auth' | 'playtomic';

export interface Club {
  id: string;
  name: string;
  shortName?: string;
  source: ClubSource;
  // kluby.org slug
  klubySlug?: string;
  // Playtomic tenant UUID
  playtomicTenantId?: string;
  // Playtomic URL slug (for booking link)
  playtomicSlug?: string;
  // Fallback court type when scraper can't detect from court name
  defaultCourtType?: 'indoor' | 'outdoor';
}

export const CLUBS: Club[] = [
  {
    id: 'loba-padel',
    name: 'Loba Padel',
    source: 'playtomic',
    playtomicTenantId: '3ae6a706-eba4-42be-9cb3-074c7ade27bb',
    playtomicSlug: 'loba-padel',
  },
  {
    id: 'mana-padel',
    name: 'Mana Padel',
    source: 'kluby-auth',
    klubySlug: 'mana-padel',
    defaultCourtType: 'indoor',
  },
  {
    id: 'toro-padel',
    name: 'Toro Padel',
    source: 'kluby',
    klubySlug: 'toro-padel',
    defaultCourtType: 'indoor',
  },
  {
    id: 'interpadel',
    name: 'InterPadel Warszawa',
    source: 'playtomic',
    playtomicTenantId: '057c5f40-f54b-4e4d-977c-1f9547a25076',
    playtomicSlug: 'interpadel-warszawa',
  },
  {
    id: 'warsaw-padel-club',
    name: 'Warsaw Padel Club',
    shortName: 'WPC',
    source: 'playtomic',
    playtomicTenantId: 'e7284c78-e269-44ad-8f3d-a4d63089c80c',
    playtomicSlug: 'warsaw-padel-club',
  },
  {
    id: 'rqt-sport',
    name: 'RQT Spot',
    source: 'playtomic',
    playtomicTenantId: '44340c7a-0951-47bd-8a7e-ccbe0703cdc3',
    playtomicSlug: 'rqt-spot',
  },
  {
    id: 'padlovnia',
    name: 'Padlovnia',
    source: 'kluby-auth',
    klubySlug: 'padlovnia',
  },
  {
    id: 'rakiety-pge-narodowy',
    name: 'Rakiety PGE Narodowy',
    shortName: 'Rakiety',
    source: 'playtomic',
    playtomicTenantId: '153bbff6-abf6-4ffe-ad93-ba1045e9d43b',
    playtomicSlug: 'rakiety-pge-narodowy',
    defaultCourtType: 'outdoor',
  },
];
