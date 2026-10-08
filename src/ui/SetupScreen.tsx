import { useMemo, useReducer } from 'react';
import { createSpotifyProvider } from '../audio/spotifyConnect';
import { isLoggedIn, isSpotifyConfigured, login, logout } from '../auth/spotifyAuth';
import { clearPlayed, loadPlayed, orderForDeck } from '../data/history';
import { allSongs, filterSongs, listDecades, listGenres } from '../data/pool';
import type { Song } from '../game/types';
import type { Settings } from '../settings';
import { DevicePicker } from './DevicePicker';
import { FullscreenButton } from './FullscreenButton';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onStart: (songs: Song[]) => void;
  onResume?: () => void;
  loginReady: boolean;
  loginError: string | null;
}

const toggle = <T,>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function SetupScreen({
  settings,
  onChange,
  onStart,
  onResume,
  loginReady,
  loginError,
}: Props) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const loggedIn = loginReady && isLoggedIn();
  const spotifyProvider = useMemo(() => createSpotifyProvider(), []);
  const genres = useMemo(() => listGenres(allSongs), []);
  const decades = useMemo(() => listDecades(allSongs), []);
  const available = filterSongs(allSongs, settings);
  const played = new Set(loadPlayed());
  const unplayed = available.filter((s) => !played.has(s.id)).length;
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  const spotifyReady = settings.audio === 'mock' || (loggedIn && settings.deviceId !== null);
  const canStart = available.length >= 2 && spotifyReady;

  return (
    <main className="setup">
      <header className="setup-header">
        <h1>MyMusicQuest</h1>
        <p>Hört rein, ratet das Jahr und baut eure Zeitleiste.</p>
        <FullscreenButton className="btn small fullscreen" />
      </header>

      <section className="panel">
        <h2>Teams</h2>
        <div className="teams">
          {settings.teamNames.map((name, i) => (
            <label key={i} className={`field team-${i}`}>
              <span>Team {i + 1}</span>
              <input
                value={name}
                maxLength={20}
                onChange={(e) => {
                  const names = [...settings.teamNames] as [string, string];
                  names[i] = e.target.value;
                  set({ teamNames: names });
                }}
              />
            </label>
          ))}
        </div>
        <label className="field inline">
          <span>Karten zum Sieg</span>
          <div className="stepper">
            <button
              type="button"
              className="btn small"
              aria-label="weniger"
              onClick={() => set({ target: Math.max(2, settings.target - 1) })}
            >
              −
            </button>
            <output>{settings.target}</output>
            <button
              type="button"
              className="btn small"
              aria-label="mehr"
              onClick={() => set({ target: Math.min(30, settings.target + 1) })}
            >
              +
            </button>
          </div>
        </label>
        <label className="field inline">
          <span>Einspruch-Jetons pro Team</span>
          <div className="stepper">
            <button
              type="button"
              className="btn small"
              aria-label="weniger Jetons"
              onClick={() => set({ challengeTokens: Math.max(0, settings.challengeTokens - 1) })}
            >
              −
            </button>
            <output>{settings.challengeTokens || 'aus'}</output>
            <button
              type="button"
              className="btn small"
              aria-label="mehr Jetons"
              onClick={() => set({ challengeTokens: Math.min(10, settings.challengeTokens + 1) })}
            >
              +
            </button>
          </div>
        </label>
        <p className="hint">
          Mit einem Jeton darf das andere Team Einspruch erheben und selbst eine Lücke wählen. Liegt
          es richtig und das Team am Zug falsch, bekommt es die Karte. Wer Titel und Interpret weiß,
          bekommt nach dem Aufdecken einen Jeton dazu.
        </p>
      </section>

      <section className="panel">
        <h2>Lieder</h2>
        <p className="hint">Nichts gewählt = alle.</p>
        <div className="chips">
          {genres.map((g) => (
            <button
              type="button"
              key={g}
              className={`chip ${settings.genres.includes(g) ? 'on' : ''}`}
              aria-pressed={settings.genres.includes(g)}
              onClick={() => set({ genres: toggle(settings.genres, g) })}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="chips">
          {decades.map((d) => (
            <button
              type="button"
              key={d}
              className={`chip ${settings.decades.includes(d) ? 'on' : ''}`}
              aria-pressed={settings.decades.includes(d)}
              onClick={() => set({ decades: toggle(settings.decades, d) })}
            >
              {String(d).slice(2)}er
            </button>
          ))}
        </div>
        <p className={available.length < 2 ? 'error' : 'hint'}>
          {available.length} Lieder verfügbar, davon {unplayed} auf diesem Gerät noch nicht gespielt
        </p>
        {played.size > 0 && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              clearPlayed();
              rerender();
            }}
          >
            Verlauf zurücksetzen
          </button>
        )}
      </section>

      <section className="panel">
        <h2>Musik</h2>
        <div className="chips">
          <button
            type="button"
            className={`chip ${settings.audio === 'spotify' ? 'on' : ''}`}
            disabled={!isSpotifyConfigured()}
            onClick={() => set({ audio: 'spotify' })}
          >
            Spotify Connect
          </button>
          <button
            type="button"
            className={`chip ${settings.audio === 'mock' ? 'on' : ''}`}
            onClick={() => set({ audio: 'mock' })}
          >
            Ohne Ton (Musik selbst abspielen)
          </button>
        </div>
        {!isSpotifyConfigured() && (
          <p className="hint">Spotify ist nicht eingerichtet (VITE_SPOTIFY_CLIENT_ID fehlt).</p>
        )}
        {loginError && <p className="error">{loginError}</p>}
        {settings.audio === 'spotify' &&
          isSpotifyConfigured() &&
          loginReady &&
          (loggedIn ? (
            <>
              <DevicePicker
                provider={spotifyProvider}
                deviceId={settings.deviceId}
                onSelect={(deviceId) => set({ deviceId })}
              />
              <button
                type="button"
                className="btn link"
                onClick={() => {
                  logout();
                  rerender();
                }}
              >
                Von Spotify abmelden
              </button>
            </>
          ) : (
            <button type="button" className="btn spotify" onClick={() => void login()}>
              Mit Spotify anmelden
            </button>
          ))}
      </section>

      <section className="panel">
        <h2>Ansicht</h2>
        <div className="chips">
          <button
            type="button"
            className={`chip ${settings.layout === 'table' ? 'on' : ''}`}
            aria-pressed={settings.layout === 'table'}
            onClick={() => set({ layout: 'table' })}
          >
            Tisch (Teams sitzen gegenüber)
          </button>
          <button
            type="button"
            className={`chip ${settings.layout === 'classic' ? 'on' : ''}`}
            aria-pressed={settings.layout === 'classic'}
            onClick={() => set({ layout: 'classic' })}
          >
            Klassisch
          </button>
        </div>
        <p className="hint">
          Tisch: Das Tablet liegt quer in der Mitte, jedes Team sieht seine Bildschirmhälfte.
        </p>
      </section>

      <div className="actions">
        {onResume && (
          <button type="button" className="btn secondary big" onClick={onResume}>
            Spiel fortsetzen
          </button>
        )}
        <button
          type="button"
          className="btn primary big"
          disabled={!canStart}
          onClick={() => onStart(orderForDeck(available, loadPlayed()))}
        >
          Spiel starten
        </button>
      </div>
    </main>
  );
}
