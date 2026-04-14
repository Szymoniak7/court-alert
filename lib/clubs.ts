export type ClubSource = 'kluby' | 'kluby-auth' | 'playtomic';

export interface Club {
  id: string;
  name: string;
  source: ClubSource;
  // kluby.org slug
  klubySlug?: string;
  // Playtomic tenant UUID
  playtomicTenantId?: string;
}

export const CLUBS: Club[] = [
  {
    id: 'loba-padel',
    name: 'Loba Padel',
    source: 'kluby',
    klubySlug: 'loba-padel',
  },
  {
    id: 'mana-padel',
    name: 'Mana Padel',
    source: 'kluby',
    klubySlug: 'mana-padel',
  },
  {
    id: 'toro-padel',
    name: 'Toro Padel',
    source: 'kluby',
    klubySlug: 'toro-padel',
  },
  {
    id: 'interpadel',
    name: 'InterPadel Warszawa',
    source: 'playtomic',
    playtomicTenantId: '057c5f40-f54b-4e4d-977c-1f9547a25076',
  },
  {
    id: 'warsaw-padel-club',
    name: 'Warsaw Padel Club',
    source: 'playtomic',
    playtomicTenantId: 'e7284c78-e269-44ad-8f3d-a4d63089c80c',
  },
  {
    id: 'rqt-sport',
    name: 'RQT Spot',
    source: 'playtomic',
    playtomicTenantId: '44340c7a-0951-47bd-8a7e-ccbe0703cdc3',
  },
  {
    id: 'padlovnia',
    name: 'Padlovnia',
    source: 'kluby-auth',
    klubySlug: 'padlovnia',
  },
];
