# Court Alert — Stan projektu (20.04.2026)

## Co to jest
Webapka agregująca dostępność kortów padelowych w Warszawie w czasie rzeczywistym.
Deployed na Vercel: https://court-alert.vercel.app (lub podobny URL z dashboardu Vercel).
Repo: https://github.com/Szymoniak7/court-alert

---

## Architektura

```
Next.js App Router (TypeScript + Tailwind CSS)
├── app/
│   ├── page.tsx               — główny UI (presety, sidebar, CourtGrid)
│   ├── layout.tsx
│   ├── globals.css
│   ├── api/availability/
│   │   └── route.ts           — GET endpoint: pobiera sloty ze wszystkich klubów równolegle
│   └── components/
│       ├── CourtGrid.tsx      — tabela desktop: czas × klub, klikalne komórki
│       ├── CourtGridMobile.tsx — widok mobile: lista czasów z wierszami per klub
│       ├── SlotModal.tsx      — modal z listą kortów + indoor/outdoor badge + cena + "Rezerwuj →"
│       ├── useCourtGrid.ts    — wspólna logika siatki dla desktop i mobile
│       └── colors.ts          — paleta kolorów per klub
└── lib/
    ├── types.ts               — interface TimeSlot (+ courtType: indoor/outdoor)
    ├── clubs.ts               — lista 7 klubów z konfiguracją źródła danych
    ├── presets.ts             — presety czasowe + formatDatePL
    ├── pricing.ts             — dynamiczny cennik per klub (stawki z oficjalnych cenników)
    └── scrapers/
        ├── kluby.ts           — scraper HTML dla kluby.org (Cheerio, rowspan-aware)
        └── playtomic.ts       — API client dla Playtomic
```

---

## Kluby i źródła danych

### Zaimplementowane (10 klubów)

| Klub | ID | Źródło | Szczegóły |
|------|----|--------|-----------|
| Loba Padel | `loba-padel` | Playtomic API | tenantId: `3ae6a706-...` |
| Mana Padel | `mana-padel` | kluby.org (auth) | slug: `mana-padel` |
| Toro Padel | `toro-padel` | kluby.org (public) | slug: `toro-padel` |
| InterPadel Warszawa | `interpadel` | Playtomic API | tenantId: `057c5f40-...` |
| Warsaw Padel Club | `warsaw-padel-club` | Playtomic API | tenantId: `e7284c78-...` |
| RQT Spot | `rqt-sport` | Playtomic API | tenantId: `44340c7a-...` |
| Padlovnia | `padlovnia` | kluby.org (auth) | wymaga logowania |
| Rakiety PGE Narodowy | `rakiety-pge-narodowy` | Playtomic API | tenantId: `153bbff6-...`, 5 outdoor (+ 5 indoor od 1.07.2026) |
| Rakiety Aero | `rakiety-aero` | Playtomic API | tenantId: `f3f86625-...`, 1 outdoor, Wał Miedzeszyński |
| ProPadel Jutrzenki | `propadel` | kluby.org (auth) | slug: `propadel`, 5 indoor |

### Kategoria B — małe obiekty (niski priorytet)

| Klub | Uwagi |
|------|-------|
| WKT Mera | 3 outdoor padel + 3 SmartCourt (squash), mieszany obiekt |
| Tenes | mieszane tennis/padel, wymaga auth |
| Sporteum | 6 kortów (2x balon), sport niezidentyfikowany |
| TenisWil | głównie tenis |
| Miedzeszyn | 8 kortów, prawdopodobnie mieszane |
| Happy Padel | wymaga auth, 1 kort |
| Bulwary Wiślane | wymaga auth |
| Sinus Sport Club | wymaga auth |

---

## Zaimplementowane funkcjonalności

### UI
- Widok siatki desktop (czas × klub) — `CourtGrid.tsx`
- Widok mobilny — czas jako label, wiersze per klub z: nazwa | czas trwania | cena | liczba kortów
- Modal rezerwacji: lista kortów, badge indoor/outdoor (niebieski/żółty), cena, link "Rezerwuj →"
- 5 presetów czasowych + Dziś + Jutro
- Sidebar desktop + poziomy scroll mobile
- Kolorowanie komórek wg liczby kortów (1/2/3+), każdy klub ma swój kolor
- Sticky header z przyciskiem odświeżenia + timestamp ("przed chwilą / X min temu")
- Filtrowanie po klubach (checkbox per klub) + Zaznacz/Odznacz wszystko
- Animacja modala (fade-in tło, slide-up panel)
- Blokada scrolla body gdy modal otwarty
- Spinner podczas ładowania, kontekstowy empty state
- Auto-refresh co 3 minuty gdy karta widoczna
- Polska odmiana liczebników (slot/sloty/slotów, kort/korty/kortów)

### Backend / API
- `GET /api/availability?dates=...&from=...&to=...&clubs=...`
- Równoległe pobieranie: daty × kluby (Promise.allSettled)
- Deduplicacja slotów (per kortId+data+czas)
- Filtrowanie po godzinach i przeszłych slotach dla dzisiaj (czas Warszawski)

### Cennik (`lib/pricing.ts`)
- Dynamiczne ceny dla wszystkich klubów kluby.org (stawki z oficjalnych cenników, sprawdzone 18.04.2026)
- Uwzględnia: godzinę, dzień tygodnia (weekend/dzień roboczy), typ kortu (indoor/outdoor)
- Padlovnia: osobny cennik outdoor (korty 8-11) i indoor (korty 1-7)
- Kluby Playtomic: ceny z API bezpośrednio

### Indoor/Outdoor (`courtType`)
- Playtomic: z `properties.resource_type` w tenant endpoint
- kluby.org: z nazwy kortu (keywords: zewn/outdoor/open vs kryt/indoor/wewn)
- Padlovnia hardcode: korty 1-7 = indoor, 8-11 = outdoor
- Badge wyświetlany w SlotModal

### Padlovnia (autoryzacja)
- Login POST do `/klub/padlovnia/dedykowane/logowanie`
- Session cache 23h w Upstash Redis (key: `kluby:session:padlovnia`)
- Fallback na świeży login gdy Redis niedostępny

---

## Zmienne środowiskowe

```
KLUBY_EMAIL=szymon.garbarczyk@gmail.com
KLUBY_PASSWORD=SIRalex2008..
REDIS_URL=<Upstash Redis URL>
```

---

## Naprawione bugi (wszystkie sesje)

1. **Playtomic UTC timezone** — start_time w UTC, sloty pokazywały się 2h za wcześnie/późno.
2. **Padlovnia login** — POST body wymagał `logowanie=1` (wartość przycisku submit).
3. **Playtomic booking URLs** — używało `clubId` zamiast `playtomicSlug`.
4. **Stale data na Vercel** — `revalidate: 300` cachowało dane 5 min. Zamienione na `cache: 'no-store'`.
5. **Przeszłe sloty dla dzisiaj** — błędny format locale `pl-PL`. Naprawione przez `en-CA`/`en-GB`.
6. **endTime "25:00"** — brak `% 24` w obliczaniu godziny końca.
7. **Podwójny fetch** — `slots.length` w deps array powodował pętlę. Naprawione przez `hasDataRef`.
8. **Reset timera auto-refresh** — `useEffect([fetchSlots])` resetował interval przy zmianie filtrów.
9. **Format daty "04.16"** — `slice(5).replaceAll('-','.')` dawał miesiąc.dzień. Naprawione na dzień.miesiąc.
10. **Hardcodowane 90 min dla każdego slotu** — scraper nie sprawdzał kiedy zaczyna się kolejna rezerwacja. Przepisano `parseGrafikHtml` na 2-pass: budowa siatki + obliczenie realnego czasu do kolejnej rezerwacji. Filtr: `< 60 min` → ukryty, `> 120 min` → cappowany do 2h.

---

## Analiza strategiczna

### Unikalna wartość
Jedyne zdanie opisujące unikalną wartość: *"Powiedz mi kiedy zwolni się kort."*
Widok kalendarza robi też padelnow.org — **alerty** to jedyna funkcja której nikt nie ma.

### Co trzeba zbudować (priorytety)
| Priorytet | Co | Dlaczego |
|-----------|----|----|
| 🔴 | Fix bug BANDERAS (Mana/Loba auth) | Pokazujemy błędne dane |
| 🔴 | Alerty — formularz + DB + cron + WhatsApp/SMS | Jedyna unikalna wartość |
| 🟡 | Dodanie nowych klubów | padelnow.org ma ~15, my mamy 7 |
| 🟢 | Landing page / onboarding | Konwersja nowych |
| 🟢 | PWA / add to homescreen | Retention mobile |

### Alerty — decyzje do podjęcia
| Pytanie | Opcje |
|---------|-------|
| Gdzie baza danych? | Vercel Postgres / Supabase / PlanetScale |
| Powiadomienia przez? | WhatsApp (Twilio) / SMS / Email |
| Ile alertów per użytkownik? | 1 bezpłatny / nielimitowane |
| Kiedy kasować alert? | Po wysłaniu / manualnie / po X dniach |

---

## Otwarte problemy techniczne

### 1. kluby.org scraper — fragility
Parsowanie HTML wrażliwe na zmiany layoutu strony. Jedyny sygnał awarii: `errors[]` w odpowiedzi API.

### 2. Playtomic — brak deep-linku do slotu
Link "Rezerwuj →" prowadzi na stronę klubu, nie konkretny slot. padelnow.org ma deep-linki — prawdopodobnie generuje je przez własny backend jako `{resourceId}-{startTime}-{duration}`.

### 3. Deduplication preferencja 90min
Przy deduplikacji zostaje slot 90min zamiast 60min. Może ukrywać krótsze opcje.

---

## Historia sesji

### Sesja 1 (ok. 10-14.04.2026)
- Stworzenie projektu Next.js
- Scraper kluby.org (Cheerio, rowspan) + Playtomic API client
- 7 klubów, podstawowy UI, deploy na Vercel
- Naprawione: UTC timezone, Padlovnia login, booking URLs, stale data cache

### Sesja 2 (16-17.04.2026)
- Refaktoryzacja: `useCourtGrid`, `useFilters`, `useSlots`
- Upstash Redis dla Padlovnia session cache
- Presety Dziś/Jutro, empty state, animacje, auto-refresh
- Naprawione: endTime >24h, podwójny fetch, reset timera, format daty

### Sesja 3 (18-19.04.2026)
- Przepisany `CourtGridMobile.tsx` (5+ iteracji) — czyste kolumny: nazwa | czas | cena | korty
- Nowy `lib/pricing.ts` — dynamiczny cennik dla wszystkich klubów kluby.org (z oficjalnych stron)
- Indoor/outdoor detection + badge w SlotModal
- Padlovnia hardcode: korty 1-7 indoor, 8-11 outdoor
- `TimeSlot` rozszerzony o `courtType`
- Próba naprawy bugu BANDERAS (filtr tekstu linka) — **niezweryfikowana**

### Sesja 4 (20.04.2026) — TUTAJ SKOŃCZYŁY SIĘ TOKENY
- Wczytanie kontekstu z poprzedniej sesji
- Identyfikacja prawdziwej przyczyny bugu BANDERAS: Mana Padel używa `source: 'kluby'` (bez auth), publiczny widok grafiku prawdopodobnie nie pokazuje zajętości kortów
- **Następny krok**: zweryfikować curl-em i zmienić Mana + Loba na `source: 'kluby-auth'`

### Sesja 5 (20.04.2026)

#### Bugi
- **Fix hardcodowane 90 min** — przepisano `parseGrafikHtml` na 2-pass: budowa pełnej siatki time×court, potem obliczenie realnego czasu do następnej rezerwacji (`freeCount × 30 min`). Np. kort wolny 16:00-16:30 pokazywał 90 min zamiast 30 min.
- **Filtr < 60 min** — sloty krótsze niż 1h ukrywane (padel nie da się zarezerwować na 30 min)
- **Cap 120 min** — sloty z oknem > 2h cappowane do 2h (standardowe rezerwacje to 1h/1.5h/2h)
- **Fix `formatDuration`** w mobile — obsługa dowolnych czasów (30m, 1h30m, 2h) zamiast hardcoded cases

#### Bezpieczeństwo — incydent Vercel (20.04.2026)
Wyciek danych z Vercel (sprzedaż env vars na zewnątrz):
- Zmieniono hasło konta na kluby.org
- Zrotowano hasło Redis Cloud (baza court-alert-session)
- Zaktualizowano `REDIS_URL` i `KLUBY_PASSWORD` w Vercel env vars + `.env.local`
- Redeploy na Vercel z nowymi credentials
- Włączono 2FA na koncie Vercel i GitHub

#### Performance
- **Usunięto `enrichWithPrices`** — pobierał ceny z booking pages (login + 1 HTTP request per kort = do 9 dodatkowych requestów per klub). Zastąpiony przez `calculateKlubyPrice` z dokładnym statycznym cennikiem. Efekt: -85 linii kodu, brak dodatkowych HTTP requestów.
- **Redis connection timeout 2s** — wcześniej brak timeoutu mógł powodować wiśnięcie przy wolnym połączeniu
- **Redis cache odpowiedzi API (2 min TTL)** — pierwsza osoba fetuje dane, każda kolejna przez 2 min dostaje odpowiedź z cache (<100ms). Cache invalidowany przy błędach (nie cachujemy partial results).
- **Vercel cron co 5 min** (`/api/warmup`) — pinguje API żeby zapobiec cold startom. Vercel Hobby "zasypia" funkcję po ~10 min bezczynności, cold start trwa ~6s. Cron utrzymuje funkcję ciepłą.
- **Animacja ładowania** — odbijająca się zielona piłka padelowa z cieniem zamiast spinnera

### Sesja 6 (21.04.2026)

#### Naprawa deploymentu
- **Główna przyczyna**: cron `*/5 * * * *` w `vercel.json` blokował KAŻDY deploy od czasu dodania w sesji 5 — Vercel Hobby nie obsługuje cronów częstszych niż 1x/dzień. Wszystkie pushe od `80b26f9` cicho failowały.
- Usunięto cron z `vercel.json`, wdrożono przez `npx vercel --prod`
- Auto-deploy z GitHub powinien wrócić do normy
- Prawdziwy URL produkcyjny: `court-alert-nu.vercel.app` (nie `court-alert.vercel.app`)

#### Kluby
- **Loba Padel** → przeniesiona na Playtomic (tenant: `3ae6a706`), wszystkie 8 kortów indoor. Naprawia brak slotów (publiczny widok kluby.org nie pokazywał dostępności).
- **Mana Padel** → zmieniona na `source: 'kluby-auth'`. Publiczny widok zwracał 0 slotów. Z auth działa poprawnie (potwierdzono: 23-25.04 mają sloty).

#### UI — badge Indoor/Outdoor
- Dodano badge `Indoor` / `Outdoor` / `Indoor+Outdoor` w komórkach grida (desktop) i wierszach (mobile)
- `Indoor+Outdoor` — kolor zielony; `Indoor` — niebieski; `Outdoor` — pomarańczowy
- `defaultCourtType` w konfiguracji klubu jako fallback gdy nazwa kortu nie zawiera słów kluczowych
- Mana i Toro hardkod: `indoor`; Playtomic kluby: z API; Padlovnia: istniejący hardkod

#### Drobne
- Format czasu trwania: `1h30m` → `1.5h`
- Etykiety z wielkiej litery: `Indoor`, `Outdoor`, `Indoor+Outdoor`

### Sesja 7 (21.04.2026)

#### Nowe kluby (+3, łącznie 10)
- **Rakiety PGE Narodowy** — Playtomic `153bbff6`, 5 kortów outdoor (+ 5 indoor od 1.07.2026)
- **Rakiety Aero** — Playtomic `f3f86625`, 1 kort outdoor, Wał Miedzeszyński
- **ProPadel Jutrzenki** — kluby-auth, slug `propadel`, 5 kortów indoor
- Refaktoryzacja: `getCourtType` + `CourtTypeBadge` wyekstrahowane do `courtType.tsx`

#### Następny krok: System alertów
Architektura uzgodniona:
- **DB**: Supabase (PostgreSQL, darmowy tier)
- **Email**: Resend (100 maili/dzień gratis)
- **Cron**: cron-job.org (zewnętrzny, darmowy) → pinguje `/api/check-alerts` co 15 min
