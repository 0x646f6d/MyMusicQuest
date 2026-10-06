# MyMusicQuest

Hier entsteht ein Musik-Rate-Spiel nach dem Vorbild von **Hitster**.

## Story

Ziel ist es, Musik anzuhören und anhand des Erscheinungsjahres korrekt in eine Zeitleiste einzuordnen. Außerdem kann man Titel und Interpret erraten. Dabei spielen 2 Teams gegeneinander.

## Verlauf

Zu Beginn haben beide Teams noch keine Jahreszahl als Anhaltspunkt. Es wird das erste Lied abgespielt. Das Team, das zuerst Interpret/Titel nennt, erhält dieses Lied als erste Karte seiner Zeitleiste. Weiß es keines der Teams, wird das nächste Lied gespielt. Danach ist das andere Team an der Reihe.

Dann geht es immer abwechselnd weiter:

1. Ein Lied wird abgespielt (Titel, Interpret und Jahr sind verdeckt).
2. Das Team, das an der Reihe ist, überlegt, wann das Lied veröffentlicht wurde, und ordnet es in die Zeitleiste seiner bereits gewonnenen Karten ein (z. B. „vor 1985“, „zwischen 1985 und 1999“, „nach 1999“).
3. Das Lied wird aufgedeckt. Liegt es korrekt, bleibt es in der Zeitleiste und das Team hat eine Karte mehr. Liegt es nicht korrekt, wird es verworfen. Die Jahreszahlen werden mit `>=` und `<=` verglichen – ein Lied mit demselben Jahr wie ein Nachbar ist also korrekt.
4. Das andere Team ist an der Reihe.

Das Spiel endet, sobald ein Team die vorher festgelegte Anzahl an Karten (Standard: 10) gesammelt hat, oder wenn keine Lieder mehr übrig sind (dann gewinnt das Team mit mehr Karten).

Mögliche Erweiterungen später: Bonus für richtig genannten Titel/Interpret, Joker/Tokens wie bei Hitster.

## Technologie

### Liederauswahl

Die Lieder werden vor jedem Spiel zufällig gemischt. Man kann nach Genre und Jahrzehnt filtern. Im ersten Schritt ist die Liste manuell gepflegt (`src/data/songs.json`, 40 Test-Songs), später soll das automatisiert werden (z. B. Import aus Spotify-Playlists, Jahr über MusicBrainz verifiziert).

**Wichtig:** Die Jahreszahl wird nicht von Spotify übernommen, weil `release_date` dort oft das Datum eines Remasters oder einer Compilation ist. Das Jahr in unserer Liste ist das Original-Erscheinungsjahr der Single und wird manuell geprüft.

### Runtime

Das Spiel ist eine **PWA** (React + Vite + TypeScript) und läuft im Querformat am Tablet. Eine native App ist nicht nötig, weil die PWA selbst keine Musik abspielt (siehe Audioquelle).

### Audioquelle: Spotify Connect

Die PWA steuert über die Spotify Web API ein **Spotify-Connect-Gerät**. Das kann jedes Gerät sein, auf dem Spotify läuft und das in Spotify unter „Geräte“ auftaucht: Handy, Laptop/Desktop-App, Smart-Speaker (Sonos, Echo, …), Smart-TV oder auch das Tablet selbst.

- Das Tablet ist das Spielbrett, die Musik kommt aus der Box → keine Spoiler auf dem Tablet, besserer Klang.
- Voraussetzung: Spotify Premium (vorhanden). Login per OAuth (PKCE) direkt im Browser, kein eigener Server nötig.
- Das Zielgerät muss „wach“ sein. Handys und iPads nehmen die Spotify-App nach längerer Pause aus der Geräteliste (vor allem iOS) – dann Spotify auf dem Gerät kurz öffnen und in der App „Aktualisieren“ tippen. Desktop-App, Speaker und TV sind stabil.
- Geräte mit Bildschirm (Handy, TV, Desktop) zeigen Titel und Cover an → Bildschirm wegdrehen.
- Das Abspielen direkt im Browser (Web Playback SDK) funktioniert auf Tablets nicht; YouTube scheidet wegen der API-Richtlinien (Player darf nicht versteckt werden) aus. Die Audioschicht ist trotzdem austauschbar gebaut.

### iPad vs. Android

Da die Musik über Spotify Connect läuft, ist das Tablet nur die Bedienoberfläche. Unterschiede:

| Thema                              | iPad                                                                    | Android           |
| ---------------------------------- | ----------------------------------------------------------------------- | ----------------- |
| PWA installieren                   | „Teilen → Zum Home-Bildschirm“                                          | Install-Prompt    |
| Spotify-Login in installierter PWA | Redirect kann in Safari statt in der PWA landen                         | unproblematisch   |
| Gespeicherter Login                | Safari kann PWA-Daten nach längerer Inaktivität löschen → neu einloggen | stabil            |
| Bildschirm aktiv halten            | ab iPadOS 16.4                                                          | unterstützt       |
| Tablet selbst als Spotify-Gerät    | möglich, App wird im Hintergrund pausiert                               | möglich, stabiler |

## Hosting

**GitHub Pages** (dort liegt das Repo): `https://0x646f6d.github.io/MyMusicQuest/`. Das Deployment läuft automatisch per GitHub Actions bei jedem Push auf `main`.

## Doku

README.md beschreibt Setup und Nutzung, CLAUDE.md wird bei jeder Änderung gepflegt.
Wir sind die einzigen Entwickler, wir können direkt in `main` committen.
