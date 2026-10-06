# MyMusicQuest

Musik-Rate-Spiel für zwei Teams nach dem Vorbild von **Hitster**: Ein Lied läuft, das Team am Zug ordnet es nach Erscheinungsjahr in seine Zeitleiste ein. Wer zuerst die festgelegte Anzahl an Karten hat, gewinnt.

Die App ist eine PWA für das Tablet. Die Musik läuft über **Spotify Connect** auf einem beliebigen Gerät (Handy, Laptop, Box, TV, Tablet). Hintergründe, Entscheidungen und Backlog stehen in [CLAUDE.md](CLAUDE.md).

**Live:** https://0x646f6d.github.io/MyMusicQuest/

## Spielregeln

1. **Eröffnung:** Das erste Lied läuft. Das Team, das zuerst Titel oder Interpret nennt, bekommt die Karte (Tipp auf „… wusste es“). Weiß es keiner, kommt das nächste Lied. Danach ist das andere Team dran.
2. **Zug:** Ein Lied läuft verdeckt. Das Team am Zug tippt auf die Lücke (`+`) in seiner Zeitleiste, an der das Lied seiner Meinung nach liegt.
3. **Aufdecken:** Liegt das Lied richtig (Jahr ≥ linker Nachbar und ≤ rechter Nachbar), bleibt die Karte. Sonst wird sie verworfen.
4. Die Teams wechseln sich ab. Das erste Team mit N Karten (Standard 10) gewinnt. Sind alle Lieder gespielt, gewinnt das Team mit mehr Karten.

## Spotify einrichten (einmalig)

1. Auf https://developer.spotify.com/dashboard eine App anlegen (Web API).
2. **Redirect URIs** eintragen:
   - `https://0x646f6d.github.io/MyMusicQuest/`
   - `http://127.0.0.1:5173/MyMusicQuest/` (lokal; Spotify erlaubt kein `localhost`)
3. Unter **User Management** den eigenen Spotify-Account eintragen (Development Mode).
4. Die **Client ID** kopieren. Sie ist im PKCE-Flow nicht geheim.
   - lokal: `.env.local` mit `VITE_SPOTIFY_CLIENT_ID=…` (siehe `.env.example`)
   - GitHub: Repo → Settings → Secrets and variables → Actions → **Variables** → `SPOTIFY_CLIENT_ID`

Voraussetzung ist Spotify Premium. Vor dem Spiel Spotify auf dem Abspielgerät öffnen und in der App unter „Musik“ das Gerät auswählen (ggf. „Aktualisieren“).

Ohne Spotify kann man im Modus „Ohne Ton“ spielen. Die Spielleitung spielt die Lieder dann selbst ab („Titel für Spielleitung zeigen“).

## Entwicklung

```bash
npm install
npm run dev            # http://127.0.0.1:5173/MyMusicQuest/
npm test               # Unit-Tests (Vitest)
npm run lint
npm run build          # Produktions-Build nach dist/
npm run validate-songs # prüft src/data/songs.json
npm run test:e2e       # Playwright-Smoke-Test (Tablet-Viewport, ohne Ton)
```

Für Playwright mit einem vorinstallierten Chromium: `CHROMIUM_PATH=/pfad/zu/chrome npm run test:e2e`.

## Lieder pflegen

`src/data/songs.json` enthält pro Lied `id`, `title`, `artist`, `year` (Original-Erscheinungsjahr, manuell geprüft), `genre` und optional `spotifyUri`. Ohne `spotifyUri` sucht die App den Track per Spotify-Suche und merkt ihn sich im Browser. Liefert die Suche die falsche Version (Live, Cover), die `spotifyUri` fest eintragen (Spotify → Teilen → Song-Link kopieren → `spotify:track:<ID>`).

## Deployment

Jeder Push auf `main` baut die App und veröffentlicht sie auf GitHub Pages (`.github/workflows/deploy.yml`). Einmalig unter Repo → Settings → Pages die Quelle **GitHub Actions** wählen.

## Installation am Tablet

- **Android (Chrome):** Seite öffnen → „App installieren“.
- **iPad (Safari):** Teilen → „Zum Home-Bildschirm“. Den Spotify-Login am besten direkt in der installierten App testen.
