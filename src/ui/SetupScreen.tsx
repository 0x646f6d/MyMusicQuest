import { useMemo, useReducer } from 'react';
import { createSpotifyProvider } from '../audio/spotifyConnect';
import { isLoggedIn, isSpotifyConfigured, login, logout } from '../auth/spotifyAuth';
import { allSongs, filterSongs, listDecades, listGenres, shuffle } from '../data/pool';
import type { Song } from '../game/types';
import type { Settings } from '../settings';
import { DevicePicker } from './DevicePicker';

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
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  const spotifyReady = settings.audio === 'mock' || (loggedIn && settings.deviceId !== null);
  const canStart = available.length >= 2 && spotifyReady;

  return (
    <main className="setup">
      <header className="setup-header">
        <h1>MyMusicQuest</h1>
        <p>Hört rein, ratet das Jahr und baut eure Zeitleiste.</p>
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
          {available.length} Lieder verfügbar
        </p>
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
          onClick={() => onStart(shuffle(available))}
        >
          Spiel starten
        </button>
      </div>
    </main>
  );
}
