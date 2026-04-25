export type ClubSource = 'kluby' | 'kluby-auth' | 'playtomic';

export interface Club {
  id: string;
  name: string;
  shortName?: string;
  city?: string;
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
  // ── Warszawa ──────────────────────────────────────────────────────────────
  {
    id: 'loba-padel',
    name: 'Loba Padel',
    city: 'Warszawa',
    source: 'playtomic',
    playtomicTenantId: '3ae6a706-eba4-42be-9cb3-074c7ade27bb',
    playtomicSlug: 'loba-padel',
  },
  {
    id: 'mana-padel',
    name: 'Mana Padel',
    city: 'Warszawa',
    source: 'kluby-auth',
    klubySlug: 'mana-padel',
    defaultCourtType: 'indoor',
  },
  {
    id: 'toro-padel',
    name: 'Toro Padel',
    city: 'Warszawa',
    source: 'kluby',
    klubySlug: 'toro-padel',
    defaultCourtType: 'indoor',
  },
  {
    id: 'interpadel',
    name: 'InterPadel Warszawa',
    city: 'Warszawa',
    source: 'playtomic',
    playtomicTenantId: '057c5f40-f54b-4e4d-977c-1f9547a25076',
    playtomicSlug: 'interpadel-warszawa',
  },
  {
    id: 'warsaw-padel-club',
    name: 'Warsaw Padel Club',
    shortName: 'WPC',
    city: 'Warszawa',
    source: 'playtomic',
    playtomicTenantId: 'e7284c78-e269-44ad-8f3d-a4d63089c80c',
    playtomicSlug: 'warsaw-padel-club',
  },
  {
    id: 'rqt-sport',
    name: 'RQT Spot',
    city: 'Warszawa',
    source: 'playtomic',
    playtomicTenantId: '44340c7a-0951-47bd-8a7e-ccbe0703cdc3',
    playtomicSlug: 'rqt-spot',
  },
  {
    id: 'padlovnia',
    name: 'Padlovnia',
    city: 'Warszawa',
    source: 'kluby-auth',
    klubySlug: 'padlovnia',
  },
  {
    id: 'rakiety-pge-narodowy',
    name: 'Rakiety PGE Narodowy',
    shortName: 'Rakiety PGE',
    city: 'Warszawa',
    source: 'playtomic',
    playtomicTenantId: '153bbff6-abf6-4ffe-ad93-ba1045e9d43b',
    playtomicSlug: 'rakiety-pge-narodowy',
    defaultCourtType: 'outdoor',
  },
  {
    id: 'rakiety-aero',
    name: 'Rakiety Aero',
    city: 'Warszawa',
    source: 'playtomic',
    playtomicTenantId: 'f3f86625-3c23-41fd-be77-526395fabe74',
    playtomicSlug: 'rakiety---outdoor-padel',
    defaultCourtType: 'outdoor',
  },
  {
    id: 'propadel',
    name: 'ProPadel Jutrzenki',
    shortName: 'ProPadel',
    city: 'Warszawa',
    source: 'kluby-auth',
    klubySlug: 'propadel',
    defaultCourtType: 'indoor',
  },
  {
    id: 'mera',
    name: 'WKT Mera',
    city: 'Warszawa',
    source: 'kluby-auth',
    klubySlug: 'mera',
    defaultCourtType: 'outdoor',
  },
  {
    id: 'sporteum',
    name: 'Sporteum Power Padel',
    shortName: 'Sporteum',
    city: 'Warszawa',
    source: 'kluby-auth',
    klubySlug: 'sporteum',
    defaultCourtType: 'outdoor',
  },
  {
    id: 'miedzeszyn',
    name: 'Klub Miedzeszyn',
    shortName: 'Miedzeszyn',
    city: 'Warszawa',
    source: 'kluby-auth',
    klubySlug: 'miedzeszyn',
    defaultCourtType: 'indoor',
  },
  {
    id: 'teniswil',
    name: 'TenisWil',
    city: 'Warszawa',
    source: 'kluby-auth',
    klubySlug: 'teniswil',
    defaultCourtType: 'outdoor',
  },
  {
    id: 'tenes',
    name: 'Tenes Jawczyce',
    shortName: 'Tenes',
    city: 'Warszawa',
    source: 'kluby-auth',
    klubySlug: 'tenes',
    defaultCourtType: 'outdoor',
  },

  // ── Śląsk ─────────────────────────────────────────────────────────────────
  {
    id: 'viva-padel-katowice',
    name: 'Viva Padel Katowice',
    shortName: 'Viva Padel',
    city: 'Katowice',
    source: 'playtomic',
    playtomicTenantId: '84b91836-ee5b-42f1-8c44-77cde714d2e9',
    playtomicSlug: 'viva-padel-katowice',
  },
  {
    id: 'padel-center-katowice',
    name: 'Padel Center & Academy',
    shortName: 'Padel Center',
    city: 'Katowice',
    source: 'playtomic',
    playtomicTenantId: 'dd500ac3-5004-41ee-ab6c-c60545ae3ae4',
    playtomicSlug: 'padel-center-academy',
  },
  {
    id: 'padelup-katowice',
    name: 'Padel Up Katowice',
    shortName: 'Padel Up',
    city: 'Katowice',
    source: 'kluby-auth',
    klubySlug: 'padelup',
    defaultCourtType: 'indoor',
  },
  {
    id: 'padel-team-tychy',
    name: 'Padel Team Tychy',
    city: 'Tychy',
    source: 'playtomic',
    playtomicTenantId: 'd5a93847-b621-4852-9fa1-4a310afd3423',
    playtomicSlug: 'padel-team-tychy',
  },
  {
    id: 'padel-team-bytom',
    name: 'Padel Team Bytom',
    city: 'Bytom',
    source: 'playtomic',
    playtomicTenantId: '05a9122e-d8ff-442d-a026-58b98170b4d8',
    playtomicSlug: 'padel-team-bytom',
  },
  {
    id: 'padelteam-zabrze',
    name: 'Padelteam Zabrze',
    city: 'Zabrze',
    source: 'playtomic',
    playtomicTenantId: '90779e1e-84b3-404f-820d-73a83a467b4e',
    playtomicSlug: 'padelteam-zabrze',
  },
  {
    id: 'padelmania-dabrowa',
    name: 'Padelmania Dąbrowa',
    shortName: 'Padelmania',
    city: 'Dąbrowa Górnicza',
    source: 'playtomic',
    playtomicTenantId: '7bf2e08e-d38c-414f-9c34-a80f112646d3',
    playtomicSlug: 'padelmania-club',
  },
  {
    id: 'padel-on',
    name: 'Padel On',
    city: 'Pszczyna',
    source: 'playtomic',
    playtomicTenantId: '8b616ddb-93a6-4629-a00a-b940a3f66e20',
    playtomicSlug: 'padel-on',
  },
  {
    id: 'ultra-padel-gliwice',
    name: 'Ultra Padel Gliwice',
    shortName: 'Ultra Padel',
    city: 'Gliwice',
    source: 'kluby-auth',
    klubySlug: 'ultra-padel-gliwice',
    defaultCourtType: 'indoor',
  },
  {
    id: 'sport-park-slask',
    name: 'Sport Park Śląsk',
    shortName: 'Sport Park',
    city: 'Chorzów',
    source: 'kluby-auth',
    klubySlug: 'sport-park',
  },

  // ── Wrocław ───────────────────────────────────────────────────────────────
  {
    id: 'padel-pl-wroclaw',
    name: 'Padel PL Wrocław',
    shortName: 'Padel PL',
    city: 'Wrocław',
    source: 'playtomic',
    playtomicTenantId: '280bfe06-18e4-464f-a1f3-edc0bee96e35',
    playtomicSlug: 'padel-pl-wroclaw',
  },
  {
    id: 'fiesta-padel',
    name: 'Fiesta Padel',
    city: 'Wrocław',
    source: 'playtomic',
    playtomicTenantId: 'cf58118a-353b-4ec1-a51e-ea52acc99063',
    playtomicSlug: 'fiesta-padel',
  },

  // ── Łódź ──────────────────────────────────────────────────────────────────
  {
    id: 'padel-lodz',
    name: 'Padel Łódź',
    city: 'Łódź',
    source: 'kluby-auth',
    klubySlug: 'padel-lodz',
  },
  {
    id: 'stacja-padel',
    name: 'Stacja Padel',
    city: 'Łódź',
    source: 'kluby-auth',
    klubySlug: 'stacja-padel',
    defaultCourtType: 'indoor',
  },

  // ── Opole ─────────────────────────────────────────────────────────────────
  {
    id: 'pop-yard',
    name: 'Pop Yard',
    city: 'Opole',
    source: 'playtomic',
    playtomicTenantId: '68323d20-8d88-4653-9a50-148cb9a5b49e',
    playtomicSlug: 'pop-yard-padel',
  },

  // ── Poznań ────────────────────────────────────────────────────────────────
  {
    id: 'interpadel-poznan',
    name: 'InterPadel Poznań',
    shortName: 'Interpadel Pzn',
    city: 'Poznań',
    source: 'playtomic',
    playtomicTenantId: '34f066f9-4292-4cce-923f-2fa95f1c7b47',
    playtomicSlug: 'interpadel-poznan',
    defaultCourtType: 'indoor',
  },
  {
    id: 'plek-poznan',
    name: 'Plek Padel Poznań',
    shortName: 'Plek Padel',
    city: 'Poznań',
    source: 'playtomic',
    playtomicTenantId: '56e1531e-e108-42af-b877-834a53381efa',
    playtomicSlug: 'plek-poznan',
  },
  {
    id: 'akademia-padla-bukowska',
    name: 'Akademia Padla Bukowska',
    shortName: 'Akademia Padla',
    city: 'Poznań',
    source: 'playtomic',
    playtomicTenantId: 'bc890e60-1580-43c2-8721-b96fa53bb775',
    playtomicSlug: 'akademia-padla-bukowska',
    defaultCourtType: 'indoor',
  },

  // ── Trójmiasto ────────────────────────────────────────────────────────────
  {
    id: 'interpadel-gdynia',
    name: 'InterPadel Gdynia',
    shortName: 'Interpadel Gdy',
    city: 'Trójmiasto',
    source: 'playtomic',
    playtomicTenantId: '91a60f0a-1fef-4efc-9548-3a6b37ae25e0',
    playtomicSlug: 'interpadel-gdynia',
    defaultCourtType: 'indoor',
  },
  {
    id: 'baltic-padel-club',
    name: 'Baltic Padel Club',
    shortName: 'Baltic Padel',
    city: 'Trójmiasto',
    source: 'kluby-auth',
    klubySlug: 'baltic-padel-club',
    defaultCourtType: 'indoor',
  },
  {
    id: 'gdynia-padel-club',
    name: 'Gdynia Padel Club',
    shortName: 'Gdynia Padel',
    city: 'Trójmiasto',
    source: 'kluby-auth',
    klubySlug: 'gdynia-padel-club',
  },
  {
    id: 'padbox',
    name: 'Padbox Stadion',
    city: 'Trójmiasto',
    source: 'kluby-auth',
    klubySlug: 'padbox',
    defaultCourtType: 'outdoor',
  },
  {
    id: 'padbox-kartuska',
    name: 'Padbox Kartuska',
    city: 'Trójmiasto',
    source: 'kluby-auth',
    klubySlug: 'padbox-kartuska',
    defaultCourtType: 'outdoor',
  },

  // ── Poznań (cd.) ──────────────────────────────────────────────────────────
  {
    id: 'passion-padel',
    name: 'Passion Padel',
    city: 'Poznań',
    source: 'playtomic',
    playtomicTenantId: '98ee88f9-0ad1-4c0e-84ab-f620097ee1d2',
    playtomicSlug: 'passion-padel',
    defaultCourtType: 'indoor',
  },

  // ── Toruń ─────────────────────────────────────────────────────────────────
  {
    id: 'interpadel-torun',
    name: 'InterPadel Toruń',
    shortName: 'Interpadel Tor.',
    city: 'Toruń',
    source: 'playtomic',
    playtomicTenantId: '08e4db64-8cdd-4ae1-b38e-a8f7a77bfdcc',
    playtomicSlug: 'interpadel-torun',
    defaultCourtType: 'indoor',
  },
  {
    id: 'rancho-padel-club',
    name: 'Rancho Padel Club',
    shortName: 'Rancho Padel',
    city: 'Toruń',
    source: 'playtomic',
    playtomicTenantId: '9ac2868b-0085-4e1b-b22e-229866a1ad62',
    playtomicSlug: 'rancho-padel-club',
    defaultCourtType: 'outdoor',
  },
  {
    id: 'city-padel-torun',
    name: 'City Padel Toruń',
    shortName: 'City Padel',
    city: 'Toruń',
    source: 'playtomic',
    playtomicTenantId: '828ccdaf-99e0-4989-86fb-a313529edc58',
    playtomicSlug: 'city-padel-torun',
    defaultCourtType: 'indoor',
  },

  // ── Szczecin ──────────────────────────────────────────────────────────────
  {
    id: 'fabryka-energii',
    name: 'Fabryka Energii',
    city: 'Szczecin',
    source: 'playtomic',
    playtomicTenantId: '4c0b171f-8e62-48a2-8fdc-46fb5b1073e9',
    playtomicSlug: 'fabryka-energii',
    defaultCourtType: 'indoor',
  },

  // ── Bydgoszcz ─────────────────────────────────────────────────────────────
  {
    id: 'pura-padel',
    name: 'PURA Padel',
    city: 'Bydgoszcz',
    source: 'kluby-auth',
    klubySlug: 'pura-padel-pickleball',
    defaultCourtType: 'indoor',
  },
  {
    id: 'fast-tennis',
    name: 'Fast Tennis & Padel',
    shortName: 'Fast Tennis',
    city: 'Bydgoszcz',
    source: 'kluby-auth',
    klubySlug: 'fast-tennis-gdanska',
  },

  // ── Bielsko-Biała ─────────────────────────────────────────────────────────
  {
    id: 'solar',
    name: 'Solar',
    city: 'Bielsko-Biała',
    source: 'kluby-auth',
    klubySlug: 'solar',
  },

  // ── Wrocław (cd.) ─────────────────────────────────────────────────────────
  {
    id: 'morskie-oko',
    name: 'Morskie Oko',
    city: 'Wrocław',
    source: 'kluby-auth',
    klubySlug: 'morskie-oko',
    defaultCourtType: 'outdoor',
  },

  // ── Pruszcz Gdański (Trójmiasto) ──────────────────────────────────────────
  {
    id: 'padel-park',
    name: 'Padel Park',
    city: 'Trójmiasto',
    source: 'kluby-auth',
    klubySlug: 'padel-park',
  },
];
