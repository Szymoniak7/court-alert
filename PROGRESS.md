# Court Alert — Stan projektu (15.04.2026)

## Co to jest
Webapka agregująca dostępność kortów padelowych w Warszawie w czasie rzeczywistym.
Deployed na Vercel: https://court-alert.vercel.app (lub podobny URL z dashboardu Vercel).
Repo: https://github.com/Szymoniak7/court-alert

---

## Architektura

```
Next.js 16 App Router (TypeScript + Tailwind CSS)
├── app/
│   ├── page.tsx               — główny UI (presety, sidebar, CourtGrid)
│   ├── layout.tsx
│   ├── globals.css
│   ├── api/availability/
│   │   └── route.ts           — GET endpoint: pobiera sloty ze wszystkich klubów równolegle
│   └── components/
│       ├── CourtGrid.tsx      — tabela: czas × klub, klikalne komórki
│       ├── SlotModal.tsx      — modal z listą kortów + link "Rezerwuj →"
│       └── colors.ts          — paleta kolorów per klub
└── lib/
    ├── types.ts               — interface TimeSlot
    ├── clubs.ts               — lista 7 klubów z konfiguracją źródła danych
    ├── presets.ts             — 5 presetów czasowych + formatDatePL
    └── scrapers/
        ├── kluby.ts           — scraper HTML dla kluby.org (Cheerio)
        └── playtomic.ts       — API client dla Playtomic
```

---

## Kluby i źródła danych

### Kategoria A — zaimplementowane

| Klub | ID | Źródło | Szczegóły |
|------|----|--------|-----------|
| Loba Padel | `loba-padel` | kluby.org (public) | slug: `loba-padel` |
| Mana Padel | `mana-padel` | kluby.org (public) | slug: `mana-padel` |
| Toro Padel | `toro-padel` | kluby.org (public) | slug: `toro-padel` (URL różna: `/toro-padel/grafik`) |
| InterPadel Warszawa | `interpadel` | Playtomic API | tenantId: `057c5f40-...` |
| Warsaw Padel Club | `warsaw-padel-club` | Playtomic API | tenantId: `e7284c78-...` |
| RQT Spot | `rqt-sport` | Playtomic API | tenantId: `44340c7a-...` |
| Padlovnia | `padlovnia` | kluby.org (auth) | wymaga logowania, osobny portal `/klub/padlovnia/dedykowane` |

### Kategoria A — do dodania

| Klub | Źródło | Szczegóły |
|------|--------|-----------|

### Kategoria B — małe obiekty (niski priorytet)

| Klub | Uwagi |
|------|-------|
| WKT Mera | 2-3 korty zewnętrzne |
| Tenes | 3 korty zewnętrzne (Jawczyce, 300m za granicą Warszawy) |
| Rakiety PGE Narodowy | 2-3 korty zewnętrzne |
| Spektrum | 3 korty wewnątrz + 1 zewnętrzny |
| Rakiety Aero | do zidentyfikowania |
| Miedzeszyn | 2 korty |
| Sporteum | 2 korty zewnętrzne |
| TenisWil | 3 korty zewnętrzne |

---

## Zaimplementowane funkcjonalności

### UI
- Widok siatki (czas × klub) — `CourtGrid.tsx`
- Modal rezerwacji z linkami do bookingu — `SlotModal.tsx`
- 5 presetów czasowych (Wieczory pon-pt 17-22, Poranek/Dzień/Wieczór weekend, Ten tydzień)
- Sidebar desktop + poziomy scroll mobile
- Kolorowanie komórek wg liczby kortów (1/2/3+), każdy klub ma swój kolor
- Sticky header z przyciskiem odświeżenia + timestamp ostatniej aktualizacji
- Filtrowanie po klubach (checkbox per klub)
- Spinner podczas ładowania, komunikat "Brak wolnych kortów"
- Escape + klik w tło zamyka modal

### Backend / API
- `GET /api/availability?dates=...&from=...&to=...&clubs=...`
- Równoległe pobieranie: daty × kluby (Promise.allSettled)
- Deduplicacja slotów (per kortId+data+czas, preferencja 90min > 60min)
- Filtrowanie po godzinach (fromHour/toHour)
- Filtrowanie przeszłych slotów dla dzisiaj (czas Warszawski)
- Obsługa błędów per klub (zbiorczy error state)

### Scraper kluby.org
- Parsowanie tabeli HTML z rowspan-aware logiką
- Ekstrakcja ID kortu i URL rezerwacji z linków `/rezerwuj/`
- Nazwy kortów z nagłówków tabeli (pierwsze 2 słowa)
- `cache: 'no-store'` — zawsze świeże dane

### Scraper Playtomic
- Endpoint: `https://api.playtomic.io/v1/availability`
- Cache nazw kortów 1h (in-memory, z tenant endpoint)
- **Konwersja UTC → Europe/Warsaw** — API zwraca czasy w UTC (bug odkryty 14.04)
- Data slotu korygowana gdy slot UTC przekracza północ (np. 23:00 UTC = 01:00 Warszawa następnego dnia)

### Padlovnia (autoryzacja)
- Login POST do `/klub/padlovnia/dedykowane/logowanie`
- Session cache 23h (in-memory), auto re-login po wygaśnięciu
- Body logowania wymaga pola `logowanie=1` (wartość przycisku submit)

---

## Zmienne środowiskowe

```
KLUBY_EMAIL=szymon.garbarczyk@gmail.com
KLUBY_PASSWORD=SIRalex2008..
```

Ustawione w `.env.local` (lokalnie) i w Vercel Environment Variables.

---

## Naprawione bugi

1. **Playtomic UTC timezone** — API zwraca start_time w UTC, nie w czasie lokalnym. Sloty pokazywały się 2h wcześniej/później. Naprawione przez konwersję `new Date(...Z).toLocaleTimeString({timeZone:'Europe/Warsaw'})`.

2. **Padlovnia login** — POST body wymagał pola `logowanie=1` (wartość przycisku), bez niego serwer odrzucał logowanie.

3. **Playtomic booking URLs** — linkowanie używało `clubId` (np. `interpadel`) zamiast `playtomicSlug` (np. `interpadel-warszawa`). Naprawione przez dodanie pola `playtomicSlug` do konfiguracji klubu.

4. **Stale data na Vercel** — `next: { revalidate: 300 }` cachował dane 5 min. Zamienione na `cache: 'no-store'`.

5. **Przeszłe sloty dla dzisiaj** — filter Warsaw-timezone: używa `toLocaleDateString('en-CA')` i `toLocaleTimeString('en-GB')` zamiast `Intl.DateTimeFormat` z locale pl-PL (który był buggy).

---

## Analiza strategiczna (15.04.2026)

### Gdzie jesteśmy
Solidna, dobrze wyglądająca aplikacja do przeglądania kortów. Mobile działa dobrze, UX czysty, dane aktualne. **Ale:** to nadal lepszy widok kalendarza — padelnow.org robi to samo.

### Co nas odróżni
**Alerty** — jedyna funkcja której nikt nie ma. Użytkownik ustawia: klub + godzina + dzień → dostaje WhatsApp/SMS gdy slot się zwolni. To jest produkt. Reszta to feature.

### Co trzeba zbudować
1. **Baza danych** — przechowywanie alertów użytkowników (numer, preferencje) i stanu kortów (co było wolne ostatnim razem)
2. **Cron job** — co X minut sprawdza dostępność, porównuje z poprzednim stanem, wysyła powiadomienia gdy coś się zwolniło
3. **Powiadomienia** — WhatsApp (Twilio) lub SMS. WhatsApp większy zasięg ale wymaga weryfikacji biznesowej. SMS prostszy technicznie.
4. **Formularz w apce** — prosty UI: wpisz numer, wybierz preferencje, kliknij "Alertuj mnie"

### Decyzje do podjęcia przed kodowaniem
| Pytanie | Opcje |
|---------|-------|
| Gdzie baza danych? | Vercel Postgres / Supabase / PlanetScale |
| Powiadomienia przez? | WhatsApp (Twilio) / SMS / Email |
| Ile alertów per użytkownik? | 1 bezpłatny / nielimitowane |
| Kiedy kasować alert? | Po wysłaniu / manualnie / po X dniach |

---

## Krytyczna analiza UX (15.04.2026)

### Problem fundamentalny
Aplikacja rozwiązuje połowę problemu. Użytkownik widzi wolny kort → klika "Rezerwuj" → trafia na stronę klubu → musi sam znaleźć slot → może być już zajęty. To tylko lepszy widok kalendarza, nie narzędzie do rezerwacji.

### Krytyczne problemy
1. **Brak onboardingu** — nowy użytkownik nie wie co to jest, po co tu jest, co ma zrobić.
2. **Nazwa "Court Alert" obiecuje alerty — których nie ma** — fałszywa obietnica, największa niespójność.
3. **Dane mogą być nieaktualne** — kort pokazany jako wolny mógł być zarezerwowany 30 sekund temu. Użytkownik przechodzi przez 7 kroków żeby odkryć że slot zniknął.
4. **Filtry zajmują za dużo miejsca na mobile** — 3 rzędy (presety + kluby + legenda) zanim pojawią się dane.
5. **Brak personalizacji i pamięci** — za każdym razem od nowa, wszystkie kluby zaznaczone.
6. **Modal jest słaby** — brak ceny, brak deep-linku do slotu. "Rezerwuj" to wejście na stronę klubu, nie rezerwacja.

### Kluczowa decyzja strategiczna
Czy to **narzędzie do przeglądania kortów** (to już robi padelnow.org), czy **serwis alertów** (tego nie robi nikt)?

Jedyne zdanie które opisuje unikalną wartość: *"Powiedz mi kiedy zwolni się kort."*

### Priorytety wynikające z analizy
| | Co | Dlaczego |
|--|----|----|
| 🔴 | Alerty — formularz zbierania numerów | Jedyna unikalna wartość |
| 🔴 | Skrócić filtry na mobile | Więcej miejsca na dane |
| 🟡 | Zapamiętać preferencje użytkownika | Retention |
| 🟡 | Pokazać czas ostatniej aktualizacji wyraźniej | Zaufanie do danych |
| 🟢 | Landing page / onboarding | Konwersja nowych |

---

## TODO — pozostałe zadania

### Wysoki priorytet
- [ ] **Alerty WhatsApp** — powiadomienie gdy pojawi się nowy wolny slot spełniający kryteria użytkownika (konkretna godzina, klub, dzień). Opcje: Twilio, WhatsApp Business API, lub Baileys (nieoficjalny). Wymaga persystencji stanu (DB lub plik) + crona.
- [ ] **Dodanie nowych klubów** — padelnow.org pokazuje też: Miedeszyn (id:14), Spektrum (id:15), Rakiety PGE Narodowy (id:9). Trzeba zidentyfikować ich źródła danych (kluby.org / Playtomic / inne).

### Średni priorytet
- [ ] **Lepsza strona błędów** — gdy klub zwróci błąd, teraz pokazujemy tekst pod siatką. Rozważyć inline indicator w nagłówku kolumny.
- [ ] **Bookingowy URL dla Playtomic** — teraz prowadzi do strony klubu (`/clubs/interpadel-warszawa`), nie bezpośrednio do slotu. Zbadać czy Playtomic ma deep-link do konkretnego czasu.
- [ ] **Preset "Jutro"** — przydatny quick shortcut, teraz trzeba klikać "Wieczory" i scrollować.

### Niski priorytet / do przemyślenia
- [ ] **Filtr outdoor/indoor** — przełącznik pozwalający włączyć korty kategorii B (zewnętrzne). Dotyczy: WKT Mera, Tenes, Rakiety PGE Narodowy, Rakiety Aero, Spektrum, Miedzeszyn, Sporteum, TenisWil.
- [ ] **Monetyzacja / formularz alertów** — zbieranie maili/numerów z filtrem preferencji zamiast bezpośredniego dostępu do siatki (zmniejsza darmowe wejścia, zwiększa wartość).
- [ ] **Więcej niż 7 dni** — aktualnie presety patrzą max 7 dni do przodu.
- [ ] **PWA / add to homescreen** — manifest.json + service worker.
- [ ] **Testy** — brak jakichkolwiek testów.

---

## Sesja 2 (16–17.04.2026)

### Co zrobiono

#### Naprawione bugi
- **endTime "25:00"** — `Math.floor(endMinutes / 60)` bez `% 24` dawało godziny >24. Naprawione w obu scraperach.
- **nowM parsing** — `toLocaleTimeString` z opcją tylko `minute` zwracał pełny string w V8. Naprawione przez pobranie `HH:MM` razem i split po `:`.
- **Format daty "04.16"** — `slice(5).replaceAll('-','.')` dawał miesiąc.dzień zamiast dzień.miesiąc. Naprawione w `SlotModal.tsx`.
- **Podwójny fetch** — `slots.length` w dependency array `useEffect` powodował ponowne fetchowanie po każdym załadowaniu. Naprawione przez `hasDataRef = useRef(false)`.
- **Reset timera auto-refresh** — `useEffect([fetchSlots])` resetował interval przy każdej zmianie filtrów. Naprawione przez `fetchSlotsRef` + pusty `useEffect([], [])`.

#### UI / UX
- Dodano presety **Dziś** i **Jutro** do filtra dnia
- Kontekstowy **empty state** (np. "Wszystkie sloty na dziś już minęły")
- **Wskaźnik czasu odświeżenia** w nagłówku ("przed chwilą / X min temu")
- **Zaznacz / Odznacz wszystko** dla klubów (desktop i mobile)
- Poprawna **polska odmiana** liczebników (slot/sloty/slotów, kort/korty/kortów)
- **Animacja modala** (fade-in tło, slide-up panel)
- **Blokada scrolla** body gdy modal otwarty
- **Cena** wyświetlana w modalu (z Playtomic)
- `lang="pl"` w `layout.tsx`
- **Auto-refresh** co 3 minuty gdy karta widoczna
- Modal zawsze pojawia się po kliknięciu (cofnięto skrót bezpośredniego otwierania URL)

#### Refaktoryzacja
- `useCourtGrid.ts` — wspólna logika siatki dla desktop i mobile
- `useFilters.ts` — stan filtrów + localStorage
- `useSlots.ts` — fetch, auto-refresh, loading, błędy, helpers
- `page.tsx`: ~400 → ~230 linii, samo JSX layoutu

#### Infrastruktura — Padlovnia session cache ✅
- Upstash Redis (Frankfurt, eu-central-1, plan free 30 MB)
- Sesja logowania cachowana 23h pod kluczem `kluby:session:padlovnia`
- Fallback na świeży login gdy Redis niedostępny
- `REDIS_URL` w `.env.local` i Vercel Environment Variables
- Pakiet `redis` (node-redis) zainstalowany

### Kluczowe wnioski
- **Vercel serverless = brak wspólnej pamięci** — in-memory cache działa lokalnie, ale na produkcji każde zapytanie może trafić na nowy kontener. Cache sesji, stan współdzielony → Redis/KV/DB.
- **`useCallback` dependency array** — `slots.length` w tablicy zależności powoduje pętlę. Zamiast tego używać ref.
- **Stable ref pattern** — `fetchSlotsRef.current = fetchSlots` pozwala timerowi wołać aktualną funkcję bez resetowania interwału.
- **Tailwind v4** — klasy np. `bg-gray-950` mogą nie istnieć; lepiej `bg-[#080810]`.

---

## Otwarte problemy techniczne

### 1. ~~Padlovnia session cache~~ — ROZWIĄZANE (sesja 2)
Przeniesiono do Upstash Redis. Każdy kontener Vercel odczytuje tę samą sesję.

### 2. kluby.org scraper — fragility
Parsowanie HTML jest wrażliwe na zmiany layoutu strony. Nie ma żadnych testów/alertów gdy scraper przestaje działać. Jedynym sygnałem jest `errors[]` w odpowiedzi API.

### 3. Playtomic — brak deep-linku do slotu
Link "Rezerwuj →" prowadzi na stronę klubu, nie na konkretny slot. Użytkownik musi sam znaleźć czas. padelnow.org ma deep-linki — prawdopodobnie generuje je przez własny backend (endpoint `/api/booking-link/{slotId}`). Playtomic `slotId` jest budowane po stronie klienta jako `{resourceId}-{startTime}-{duration}`.

### 4. Deduplication preferencja 90min
Przy deduplikacji zostawiamy slot 90min zamiast 60min dla tego samego kortu/czasu. Może to ukrywać krótsze opcje. Alternatywa: pokazywać oba lub pozwolić filtrować po czasie trwania.

### 5. Playtomic — query na pełną dobę UTC
Pobieramy sloty `00:00 - 23:59 UTC`, ale po konwersji na Warszawę mogą pojawić się sloty z poprzedniego/następnego dnia. Aktualnie `slotDate` jest korygowane (correct), ale `start_min/start_max` w query nie są optymalne — moglibyśmy ograniczyć do UTC 03:00-22:00 dla typowego wieczornego użycia.
