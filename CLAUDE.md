# CLAUDE.md

Hinweise für Claude Code zu diesem Repo. **Bei jeder Änderung aktuell halten.**

## Projekt

Hitster-artiges Musik-Rate-Spiel (2 Teams, Lieder nach Jahr in eine Zeitleiste einordnen) als PWA für Tablets. Fachliche Beschreibung und Entscheidungen: `STORY.md`. Nutzung/Setup: `README.md`.

## Stack & Befehle

React 19 + Vite + TypeScript, `vite-plugin-pwa`, Vitest, Playwright, ESLint (typescript-eslint, react-hooks), Prettier.

- `npm run dev` / `npm run build` / `npm run preview`
- `npm test` (Vitest, `src/**/*.test.ts`), `npm run lint`, `npx tsc -b`
- `npm run test:e2e` (baut + startet Preview auf Port 4173). In der Cloud-Umgebung: `CHROMIUM_PATH=/opt/pw-browsers/chromium`
- `npm run validate-songs`
- Icons neu rendern: `CHROMIUM_PATH=… npx tsx scripts/render-icons.ts` (aus `public/icon.svg`)

Vor jedem Commit: `npx prettier --write . && npx tsc -b && npm run lint && npm test`.

## Architektur

- `src/game/`: reine, framework-freie Spiellogik. `engine.ts` ist ein Reducer (`start`, `claimOpening`, `place`, `next`), `rules.ts` enthält `isPlacementCorrect` (>= / <=). Phasen: `opening → revealed → placing → revealed → … → finished`. Timelines sind immer nach Jahr sortiert.
- `src/data/`: `songs.json` (kuratiert, 40 Songs), `pool.ts` (Filter Genre/Jahrzehnt, `shuffle`), `validate.ts`.
- `src/audio/`: `AudioProvider`-Interface; `spotifyConnect.ts` steuert ein Spotify-Connect-Gerät über die Web API (Track-URI per Suche, gecacht in localStorage); `mockProvider.ts` = ohne Ton.
- `src/auth/spotifyAuth.ts`: OAuth PKCE rein im Client. Redirect-URI = App-Basis-URL, `handleRedirect()` läuft beim App-Start.
- `src/ui/`: `SetupScreen`, `DevicePicker`, `GameScreen`, `Timeline`, `useWakeLock`. `App.tsx` hält Settings und Spielzustand (beides in localStorage persistiert, `src/storage.ts` fängt Fehler ab).

## Konventionen & Fallstricke

- UI-Texte auf Deutsch, Code und Kommentare auf Englisch.
- Basis-Pfad `/MyMusicQuest/` (GitHub Pages) in `vite.config.ts`. Keine Unterseiten-Routen, alles läuft über Zustand.
- Jahreszahlen **nie** von Spotify übernehmen (Remaster-/Compilation-Daten), sondern nur aus `songs.json`.
- Spotify: Web Playback SDK läuft nicht auf Tablets, deshalb Connect. Handys und iPads nehmen die Spotify-App nach Inaktivität aus der Geräteliste (404 → `no-device`).
- Die `react-hooks`-Lint-Regeln sind streng (`set-state-in-effect`): In Effects State nur in `.then`-Callbacks setzen.
- `VITE_SPOTIFY_CLIENT_ID` lokal in `.env.local`, im Deploy aus der Repo-Variable `SPOTIFY_CLIENT_ID`.

## Workflow

Nur zwei Entwickler, Commits direkt auf `main`. Ein Push auf `main` deployt per `.github/workflows/deploy.yml` auf GitHub Pages.
