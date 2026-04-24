# Court Alert — Stan projektu (22.04.2026)

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
    ├── clubs.ts               — lista 15 klubów z konfiguracją źródła danych
    ├── presets.ts             — presety czasowe + formatDatePL
    ├── pricing.ts             — dynamiczny cennik per klub (stawki z oficjalnych cenników)
    └── scrapers/
        ├── kluby.ts           — scraper HTML dla kluby.org (Cheerio, rowspan-aware)
        └── playtomic.ts       — API client dla Playtomic
```

---

## Kluby i źródła danych

### Zaimplementowane (15 klubów)

| Klub | ID | Źródło | Szczegóły |
|------|----|--------|-----------|
| Loba Padel | `loba-padel` | Playtomic API | tenantId: `3ae6a706-...` |
| Mana Padel | `mana-padel` | kluby.org (auth) | slug: `mana-padel`, indoor |
| Toro Padel | `toro-padel` | kluby.org (public) | slug: `toro-padel`, indoor |
| InterPadel Warszawa | `interpadel` | Playtomic API | tenantId: `057c5f40-...` |
| Warsaw Padel Club | `warsaw-padel-club` | Playtomic API | tenantId: `e7284c78-...` |
| RQT Spot | `rqt-sport` | Playtomic API | tenantId: `44340c7a-...` |
| Padlovnia | `padlovnia` | kluby.org (auth) | slug: `padlovnia`, korty 1-7 indoor / 8-11 outdoor |
| Rakiety PGE Narodowy | `rakiety-pge-narodowy` | Playtomic API | tenantId: `153bbff6-...`, 5 outdoor (+ 5 indoor od 1.07.2026) |
| Rakiety Aero | `rakiety-aero` | Playtomic API | tenantId: `f3f86625-...`, 1 outdoor |
| ProPadel Jutrzenki | `propadel` | kluby.org (auth) | slug: `propadel`, 5 indoor |
| WKT Mera | `mera` | kluby.org (auth) | slug: `mera`, outdoor |
| Sporteum Power Padel | `sporteum` | kluby.org (auth) | slug: `sporteum`, outdoor |
| Klub Miedzeszyn | `miedzeszyn` | kluby.org (auth) | slug: `miedzeszyn`, indoor |
| TenisWil | `teniswil` | kluby.org (auth) | slug: `teniswil`, outdoor |
| Tenes Jawczyce | `tenes` | kluby.org (auth) | slug: `tenes`, outdoor |

### Pominięte (celowo)

| Klub | Powód |
|------|-------|
| Happy Padel | 1 kort, zbyt mały |
| Bulwary Wiślane | wymaga auth, niepewne API |
| Sinus Sport Club | wymaga auth, niepewne API |

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

### Sesja 8 (22.04.2026)

#### Nowe kluby (+5, łącznie 15)
- **WKT Mera** — kluby-auth, slug `mera`, 3 outdoor
- **Sporteum Power Padel** — kluby-auth, slug `sporteum`, outdoor
- **Klub Miedzeszyn** — kluby-auth, slug `miedzeszyn`, indoor
- **TenisWil** — kluby-auth, slug `teniswil`, outdoor
- **Tenes Jawczyce** — kluby-auth, slug `tenes`, outdoor
- Cennik dodany dla wszystkich 5 nowych klubów w `lib/pricing.ts`
- Kolory dodane w `app/components/colors.ts`

#### Naprawa produkcji — rate limiting kluby.org
Wszystkie 8 klubów kluby-auth sypało błędem "Błąd pobierania". Diagnoza: `getDates('weekdays')` = 10 dat × 8 klubów = 80 równoległych requestów do kluby.org → rate limiting.

Naprawy (2 commity):
1. **Semaphore** (`makeSemaphore(8)`) w `route.ts` — max 8 równoległych requestów do kluby.org
2. **Per-club-per-date slot cache** w Redis (TTL 5 min) — cold cache fetuje sieć, warm cache zwraca <10ms
   - Klucz: `slots:v1:{clubId}:{date}`
   - Zaimplementowane w obu scraperach: `kluby.ts` i `playtomic.ts`

#### Architektura cache (3 warstwy)
1. `slots:v1:{clubId}:{date}` — 5 min, poziom scrapera (główna optymalizacja)
2. `availability:v1:...` — 2 min, poziom API route (exact query)
3. Semaphore limit=8 — ochrona przed stampede przy zimnym cache

#### Skalowalność — notatka
Przy ~45 klubach (skala ogólnopolska) obecna architektura pull-on-demand się posypie (Vercel timeout).
Właściwe rozwiązanie: background pre-fetch (cron co 5 min → zapisuje do Redis, API tylko czyta).
Do wdrożenia przy okazji systemu alertów (i tak potrzebny cron).

#### Następny krok: System alertów
Architektura uzgodniona:
- **DB**: Supabase (PostgreSQL, darmowy tier)
- **Email**: Resend (100 maili/dzień gratis)
- **Cron**: cron-job.org (zewnętrzny, darmowy) → pinguje `/api/check-alerts` co 15 min

### Sesja 9 (23-24.04.2026) — Maksymalne przyspieszenie ładowania

#### Root cause analizy
- Default preset był "weekdays" = 15 klubów × 10 dat = **150 zadań** cold cache → timeout Vercel 10s → crash
- Brak pre-warmingu (Vercel cron usunięty w sesji 6) → cold start 2-6s na każdej wizycie
- Stary `/api/warmup` wołał sam siebie przez HTTP (zawodne na Vercel)
- Jeden `setSlots()` na każdy chunk streamingu → 150 re-renderów w 100ms na słabym telefonie

#### Zmiany

**Streaming NDJSON** (`/api/availability/stream/route.ts`, nowy):
- Emituje dane każdego klubu osobno gdy tylko są gotowe
- Nagłówki `X-Accel-Buffering: no` (wyłącza buforowanie nginx/Vercel)
- Klient widzi pierwsze korty w <200ms (Playtomic warm cache)

**`lib/fetchClubSlots.ts`** (nowy):
- Wspólna logika semaphore + buildTasks wydzielona z route.ts
- Używana w: `/api/availability`, `/api/availability/stream`, `/api/warmup`

**`/api/warmup`** (przepisany):
- Teraz bezpośrednio populuje Redis slot cache dla dziś + jutro (wszystkie 15 klubów)
- Nie wołał już siebie przez HTTP (było zawodne)
- Do wywołania: cron-job.org co 5 min → `GET court-alert-nu.vercel.app/api/warmup`

**`app/hooks/useSlots.ts`** (streaming fetch):
- Czyta NDJSON przez `body.getReader()`, aktualizuje grid sukcesywnie
- Debounce renderów: max 1 `setSlots()` co 150ms (throttle) — zapobiega freeze na słabych telefonach
- `loading=false` po pierwszym chunku, nie po ostatnim

**`app/page.tsx`**:
- Grid pokazuje się gdy `slots.length > 0` — nie czeka na koniec streamingu
- Dimming (`opacity-40`) tylko przy auto-refresh (nie przy pierwszym ładowaniu streamingu)

**Default preset: "weekdays" → "Dziś"** (`useFilters.ts`):
- Najważniejsza zmiana: 150 zadań → 15 zadań
- Cold cache "Dziś": ~1.5-2.5s total, pierwsze dane w <500ms
- Cold cache "weekdays" = hit timeout Vercel 10s = crash

**Slot cache TTL: 5 min → 10 min** (kluby.ts + playtomic.ts)

#### Wymagana akcja: cron-job.org
1. Wejdź na cron-job.org (darmowy)
2. Nowy job: `GET https://court-alert-nu.vercel.app/api/warmup`
3. Harmonogram: co 5 minut
4. Zapisz

Bez tego crona: każdy użytkownik po 10 min bezczynności trafia na cold start (2-6s nic).
Z cronem: funkcja zawsze ciepła, Redis zawsze zasilony, ładowanie <200ms.

#### Architektura wydajnościowa po sesji 9
```
Nowy użytkownik (warm cache + cron aktywny):
1. JS bundle: ~1s
2. GET /api/availability/stream (15 zadań × 1 data):
   - Redis HIT per klub: ~10-20ms
   - Pierwsze chunkі klienta: <100ms
   - Pełne dane: <300ms
3. Grid widoczny: ~1.1s od wejścia na stronę

Nowy użytkownik (cold cache, bez crona):
1. JS bundle: ~1s
2. GET /api/availability/stream (15 zadań):
   - 7 Playtomic parallel: ~500ms, pierwsze dane widoczne
   - 8 kluby-auth semaphore(8) = 1 batch: ~1-2s
3. Grid widoczny: ~1.5s, pełne dane: ~2.5s od wejścia
```

### Sesja 10 (24.04.2026) — UX mobile + redesign identyfikacji klubów

#### UX mobile — drobne poprawki
- **`1h+` → `od 1h`** — spójność z `od X PLN`; "od" oznacza "minimum, są dłuższe opcje"
- **`[Indoor+Outdoor]` → `[In][Out]`** — dwie osobne pigułki zamiast jednej szerokiej; niebieski/pomarańczowy, mniejsza szerokość, czytelniej
- **Status bar ukryty na mobile** (`hidden lg:flex`) — data i liczba slotów są już w sticky headerach sekcji `CourtGridMobile`; na desktopie status bar zostaje bez zmian
- `target="_blank"` na linku "Rezerwuj →" — był już obecny w `SlotModal.tsx`

#### Czcionka — Space Grotesk
- Zastąpiono Arial (nigdy nieaplikowany — body miał `font-family: Arial` mimo załadowanego Geist) przez **Space Grotesk**
- Załadowany przez `next/font/google` z wagami 300–700
- `Geist_Mono` zostaje dla czasów i liczb (tabular-nums)
- Decyzja: Space Grotesk jako font premium dla dark-mode utility app — charakterystyczne kroje, mocno wygląda bold, używany przez Railway / Resend

#### Redesign identyfikacji klubów — kolorowe kropki → lewy bar

**Decyzja designerska:**
Użytkownik identyfikuje kluby po **nazwie**, nie po kolorze. Kolorowe kropki były:
- Arbitralne (dlaczego Loba zielona, RQT żółty — brak semantyki)
- Za małe (8px na ciemnym tle = niewidoczne)
- Dekoracyjne a nie strukturalne — "naklejka" obok nazwy

**Rozwiązanie: 3px kolorowy bar po lewej krawędzi karty**
- `position: absolute; left: 0; top: 0; bottom: 0; width: 3px` wewnątrz `overflow-hidden` — border-radius karty przycina bar czysto w narożnikach
- Kolor jako element struktury karty (jak Linear, VS Code tabs), nie ozdobnik
- Oko skanuje lewą krawędź listy przy scrollowaniu — bar jest tam gdzie wzrok naturalnie pada
- Przy wielu klubach w tym samym slocie: szybka identyfikacja kolorystyczna bez zaśmiecania rzędu

**Zmiany w kodzie:**
- `colors.ts` — usunięto `dot: string`, dodano `hex: string` z rzeczywistymi wartościami CSS (np. `#34d399` dla emerald-400)
- `CourtGridMobile.tsx` — usunięto `<span className={dot}>`, dodano `<span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color.hex }} />`
- `CourtGrid.tsx` — usunięto kropkę z nagłówka tabeli (zostaje kolorowy tekst nazwy klubu przez `color.header`)
- `SlotModal.tsx` — usunięto kropkę z headera modala, zastąpiona 3px × 20px pionową kreską w kolorze klubu
- `page.tsx` — usunięto kropki z chipów filtrów (mobile) i listy klubów (desktop sidebar); usunięto import `CLUB_COLORS` (już nieużywany w page.tsx)

### Sesja 11 (25.04.2026) — Plan systemu alertów

#### Decyzje produktowe
- Kanały powiadomień: **Push (PWA) + SMS (Twilio)** jako MVP, **WhatsApp** docelowo
- Email odpada jako kanał powiadomień — zostaje tylko w potwierdzeniu zapisu
- WhatsApp: ten sam numer co SMS, inny provider (Meta Cloud API) — wymaga weryfikacji biznesowej Meta (kilka dni/tygodni)
- 1 alert = 1 powiadomienie → auto-wygaśnięcie po odpaleniu
- Limit: 3 aktywne alerty per numer telefonu
- TTL: auto-wygaśnięcie po 7 dniach jeśli nie odpalony
- Weryfikacja numeru: brak na MVP (rate limit po IP), Twilio Verify OTP później

#### Schemat DB (Supabase)

```sql
CREATE TABLE push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE alerts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                text,
  push_subscription_id uuid REFERENCES push_subscriptions,
  clubs                text[] NOT NULL,
  date                 date NOT NULL,
  time_from            smallint NOT NULL,   -- minuty od północy, np. 1080 = 18:00
  time_to              smallint NOT NULL,
  min_duration         smallint DEFAULT 60,
  created_at           timestamptz DEFAULT now(),
  fired_at             timestamptz,
  expires_at           timestamptz DEFAULT now() + interval '7 days'
);

CREATE INDEX ON alerts (fired_at, expires_at);
```

#### Fazy implementacji

**Faza 1 — SMS (2-3h)**
- Konto Twilio + env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
- Tabela `alerts` w Supabase + env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `POST /api/alerts` — zapis do DB + SMS potwierdzający
- `GET /api/check-alerts?secret=...` — scan pending alertów → match slotów → SMS przez Twilio
- UI: modal "dzwonek" w headerze → pole numer + wybór klubu/daty/czasu

**Faza 2 — Push PWA (3-4h)**
- `public/manifest.json` + `public/sw.js` (service worker)
- VAPID keys: `npx web-push generate-vapid-keys` → env vars
- Tabela `push_subscriptions` w Supabase
- `POST /api/push-subscribe` — zapis subskrypcji urządzenia
- `check-alerts`: wysyłka push przez `web-push` library równolegle z SMS
- UI: przycisk "Włącz powiadomienia" (zero friction, bez podawania numeru)

**Faza 3 — WhatsApp (gdy Meta zatwierdzi)**
- Meta Business Account + weryfikacja (rozpocząć jak najwcześniej — trwa)
- Ten sam numer w DB, nowy sending path przez Meta Cloud API
- Feature flag per alert: `channel: 'sms' | 'whatsapp'`

#### UX flow alertu
```
[dzwonek w headerze]
→ Modal: "Powiadom mnie gdy zwolni się kort"
→ [Push] zero friction  LUB  [SMS] pole "+48 XXX XXX XXX"
→ Wybór: klub(i) | data | godziny | min. czas trwania
→ [Ustaw alert]
→ Push: przeglądarka pyta o zgodę → subskrypcja zapisana
→ SMS: potwierdzenie "Alert ustawiony. Powiadomimy gdy zwolni się kort."
```

#### Następny krok
Zacząć od Fazy 1 (SMS) — najprostsze, natychmiastowa wartość. Push (Faza 2) dorzucić jako drugi kanał.

---

## Strategia biznesowa (25.04.2026)

### Pozycja na rynku

- padelnow.org (główny konkurent) też tylko przekierowuje do kluby.org — nie ma głębszych integracji. Court Alert jest na tym samym poziomie technicznie.
- Jedyna realna przewaga dziś: **alerty** — jeśli padelnow ich nie ma, to jedyna unikalna funkcja
- Playtomic to potencjalne ryzyko długoterminowe (ekspansja w Polsce), ale też stabilne API jeśli zdominuje rynek
- Court Alert ma przewagę kosztową vs Playtomic: koszt infrastruktury ~$50-100/mies. → można oferować klubom niższe prowizje i nadal zarabiać

### Modele przychodów — priorytet

| # | Model | Kiedy | Potencjał |
|---|-------|-------|-----------|
| 1 | **Sponsorowane alerty** | Od razu po uruchomieniu alertów | Skaluje z liczbą alertów |
| 2 | **Afiliacja** (Head, Babolat, sklepy) | Od razu — rejestracja w programach afiliacyjnych | Pasywny, rośnie z traffikiem |
| 3 | **Last-minute deals** | Po alertach | Clubs mają ból, proste do pitch |
| 4 | **"Szukam partnera"** | Równolegle z alertami | Największy driver retencji |
| 5 | **B2C freemium** (alerty płatne) | Gdy masz bazę userów | 10-20 PLN/mies., 2-5% konwersja |
| 6 | **Corporate benefit** | 6-12 mies. | Inny buyer (HR), duże budgety |
| 7 | **Dashboard analityczny dla klubów** | Po pierwszych direct integracjach | 200-500 PLN/mies./klub, B2B SaaS |
| 8 | **Dane/raport inwestycyjny** | Gdy masz 3+ mies. danych | Jednorazowy 2-10k PLN |
| 9 | **API jako produkt** | Gdy dane stabilne | Pasywny, skalowalny B2B |
| 10 | **Turnieje i eventy** | Gdy masz ogólnopolską skalę | Nowy segment, ta sama baza |

### Sponsorowane alerty — szczegóły

Najważniejszy insight: moment otrzymania alertu to **peak attention** użytkownika (podekscytowany, telefon w ręku, zaraz bookuje). CTR reklamy w tym momencie może być 10-20x wyższy niż standardowy banner.

Format SMS:
```
Wolny kort! Mana Padel, jutro 19:00-21:00, 400 PLN → [link]
Sponsorowane przez HEAD: -10% z kodem COURTALERT → head.com/pl
```

Podejście:
1. Teraz: rejestracja w programach afiliacyjnych (Head, Babolat, Padelmania.pl) — 1h
2. Po 5k+ alertów/mies.: direct sponsorship (wyłączność kategorii) — 1,000-5,000 PLN/mies.

### Dashboard analityczny dla klubów — kluczowy insight

Klub widzi tylko swoje rezerwacje. Court Alert widzi **niezaspokojoną podaż** — kiedy ludzie szukają kortów których nie ma. Ta informacja jest nieosiągalna dla klubu bez agregatoraTa unikalna pozycja to fundament pod B2B w przyszłości.

### Sekwencja ogólnopolskiej ekspansji

1. Warszawa (done — 15 klubów)
2. Kraków, Wrocław, Trójmiasto — następne
3. Pozostałe duże miasta
4. Ogólnopolska skala → leverage w rozmowach z markami i klubami
