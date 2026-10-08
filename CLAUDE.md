# CLAUDE.md

Hinweise für Claude Code zu diesem Repo. **Bei jeder Änderung aktuell halten.**

## Projekt

Hitster-artiges Musik-Rate-Spiel (2 Teams, Lieder nach Jahr in eine Zeitleiste einordnen) als PWA für Tablets. Nutzung/Setup: `README.md`. Live: https://0x646f6d.github.io/MyMusicQuest/

## Spielregeln

1. **Eröffnung:** Noch keine Karten. Erstes Lied läuft; das Team, das Titel/Interpret zuerst nennt, bekommt es als erste Karte. Weiß es keiner → Lied verworfen, nächstes Lied. Danach ist das andere Team dran.
2. **Zug:** Lied läuft verdeckt. Das Team am Zug ordnet es in seine eigene Zeitleiste ein (erste Platzierung in leerer Zeitleiste ist immer richtig).
3. **Aufdecken:** Richtig, wenn `linker Nachbar.year <= year <= rechter Nachbar.year` (gleiches Jahr zählt als richtig) → Karte bleibt; sonst verworfen.
4. **Einspruch:** Jedes Team hat Einspruch-Jetons (Standard 3, einstellbar 0–10, 0 = aus). Hat der Gegner Jetons, ist eine Platzierung erst vorläufig (Phase `pending`, außer bei der ersten Karte eines Teams): Das aktive Team kann die Stelle noch ändern und aufdecken, oder der Gegner gibt einen Jeton ab und tippt eine andere Lücke in der Zeitleiste des aktiven Teams an. Aktives Team richtig → behält die Karte (auch wenn beide richtig liegen). Aktives Team falsch, Einspruch richtig → Karte wird nach Jahr in die Zeitleiste des Gegners einsortiert. Beide falsch → verworfen. Jeton ist in jedem Fall weg.
5. Teams wechseln sich ab. Sieg: erstes Team mit N Karten (Standard 10, einstellbar 2–30). Pool leer → mehr Karten gewinnt, sonst unentschieden.

Liedauswahl: filterbar nach Genre (nur Rock und Pop) und Jahrzehnt. Jedes Gerät merkt sich gespielte Lieder (`mmq.played` in localStorage). Beim Spielstart kommen erst noch nie gespielte Lieder (zufällig gemischt), danach bereits gespielte, das am längsten nicht gespielte zuerst. Verlauf in der Einrichtung zurücksetzbar.

## Stack & Befehle

React 19 + Vite + TypeScript, `vite-plugin-pwa`, Vitest, Playwright, ESLint (typescript-eslint, react-hooks), Prettier.

- `npm run dev` / `npm run build` / `npm run preview`
- `npm test` (Vitest, `src/**/*.test.ts`), `npm run lint`, `npx tsc -b`
- `npm run test:e2e` (baut + startet Preview auf Port 4173). In der Cloud-Umgebung: `CHROMIUM_PATH=/opt/pw-browsers/chromium`
- `npm run validate-songs`
- Icons neu rendern: `CHROMIUM_PATH=… npx tsx scripts/render-icons.ts` (aus `public/icon.svg`)

Vor jedem Commit: `npx prettier --write . && npx tsc -b && npm run lint && npm test`.

## Architektur

- `src/game/`: reine, framework-freie Spiellogik. `engine.ts` ist ein Reducer (`start`, `claimOpening`, `place`, `reveal`, `challenge`, `next`), `rules.ts` enthält `isPlacementCorrect` (>= / <=) und `insertSorted`. Phasen: `opening → revealed → placing → [pending →] revealed → … → finished`. `cardOwner(result)` sagt, wer die Karte bekommen hat. `tokens`/`winner` fehlen in alten gespeicherten Spielen (→ `tokensOf`, `cardOwner` fangen das ab). Timelines sind immer nach Jahr sortiert.
- `src/data/`: `songs.json` (~1900 Songs, Genres nur `Rock` und `Pop`, jedes Lied nur einmal), `pool.ts` (Filter Genre/Jahrzehnt, `shuffle`), `history.ts` (Verlauf gespielter Lieder, `orderForDeck`), `validate.ts`. `loadSettings` verwirft Genres, die es in `songs.json` nicht mehr gibt.
- `src/audio/`: `AudioProvider`-Interface; `spotifyConnect.ts` steuert ein Spotify-Connect-Gerät über die Web API (Track-URI per Suche, gecacht in localStorage); `mockProvider.ts` = ohne Ton.
- `src/auth/spotifyAuth.ts`: OAuth PKCE rein im Client. Redirect-URI = App-Basis-URL, `handleRedirect()` läuft beim App-Start.
- `src/ui/`: `SetupScreen`, `DevicePicker`, `GameScreen`, `TableLayout`, `Timeline`, `useWakeLock` (hält während des Spiels den Bildschirm an, fordert den Lock nach Sichtbarkeitswechsel und beim nächsten Tippen neu an), `useFullscreen`/`FullscreenButton` (Vollbild-Umschalter in Einrichtung und Spiel, ausgeblendet ohne Fullscreen-API, z. B. iPhone). Einspruch-Modus ist lokaler UI-State (an die Lied-ID gebunden); in der Tisch-Ansicht zeigt die Gegner-Hälfte dann die Zeitleiste des aktiven Teams, damit sie nicht auf dem Kopf steht. Zwei Ansichten (Setting `layout`): `table` (Standard; Tablet liegt quer zwischen den Teams, obere Hälfte um 180° gedreht, Steuerung in der Mitte, Texte aus Sicht des jeweiligen Teams) und `classic`. `App.tsx` hält Settings und Spielzustand (beides in localStorage persistiert, `src/storage.ts` fängt Fehler ab).

## Konventionen & Fallstricke

- UI-Texte auf Deutsch, Code und Kommentare auf Englisch.
- Basis-Pfad `/MyMusicQuest/` (GitHub Pages) in `vite.config.ts`. Keine Unterseiten-Routen, alles läuft über Zustand.
- Jahreszahlen **nie** von Spotify übernehmen (Remaster-/Compilation-Daten), sondern nur aus `songs.json`.
- Spotify: Web Playback SDK läuft nicht auf Tablets, deshalb Connect. Handys und iPads nehmen die Spotify-App nach Inaktivität aus der Geräteliste (404 → `no-device`).
- Die `react-hooks`-Lint-Regeln sind streng (`set-state-in-effect`): In Effects State nur in `.then`-Callbacks setzen.
- `VITE_SPOTIFY_CLIENT_ID` lokal in `.env.local`, im Deploy aus der Repo-Variable `SPOTIFY_CLIENT_ID`.

## Entscheidungen

- **PWA statt nativer App:** Die App spielt selbst keine Musik ab, daher reicht eine PWA.
- **Spotify Connect:** Die App steuert per Web API ein beliebiges Spotify-Gerät (Handy, Laptop, Box, TV oder das Tablet selbst). Tablet = Spielbrett, keine Spoiler, besserer Klang. Premium nötig. Geräte mit Display zeigen Titel/Cover → Bildschirm wegdrehen.
- **Verworfen:** Web Playback SDK (läuft nicht in Tablet-Browsern), YouTube (Player darf laut API-Richtlinien nicht versteckt werden, Video verrät Titel, Werbung). Audio bleibt austauschbar über `AudioProvider`.
- **Hosting GitHub Pages**, weil das Repo dort liegt; kein Backend nötig dank PKCE.

## iPad vs. Android

Die Tablet-Plattform betrifft nur die Bedienoberfläche:

| Thema                               | iPad                                                                 | Android           |
| ----------------------------------- | -------------------------------------------------------------------- | ----------------- |
| PWA installieren                    | „Teilen → Zum Home-Bildschirm“                                       | Install-Prompt    |
| Spotify-Login in installierter PWA  | Redirect kann in Safari statt in der PWA landen (getrennter Storage) | unproblematisch   |
| Gespeicherter Login                 | Safari kann PWA-Storage nach Inaktivität löschen → neu einloggen     | stabil            |
| Bildschirm aktiv halten (Wake Lock) | ab iPadOS 16.4                                                       | unterstützt       |
| Vollbild-Button                     | im Browser ja; installierte PWA ist ohnehin randlos                  | unterstützt       |
| Tablet selbst als Spotify-Gerät     | möglich, App wird im Hintergrund pausiert                            | möglich, stabiler |

## Backlog / Ideen

- Automatisierte Liedauswahl: Import aus Spotify-Playlists, Jahr über MusicBrainz verifizieren.
- Bonus für richtig genannten Titel/Interpret (z. B. zusätzlicher Einspruch-Jeton wie bei Hitster).
- Jahreszahlen und Spotify-Treffer stichprobenartig prüfen, ggf. `spotifyUri` pinnen. Bei manchen Liedern liegen Album- und Single-Jahr auseinander.
- Optional weiterer `AudioProvider` (z. B. YouTube), falls Spotify nicht verfügbar.

## Workflow

Nur zwei Entwickler, Commits direkt auf `main`. Ein Push auf `main` deployt per `.github/workflows/deploy.yml` auf GitHub Pages.
