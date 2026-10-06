import { getAccessToken } from '../auth/spotifyAuth';
import type { Song } from '../game/types';
import { readJson, writeJson } from '../storage';
import { AudioError, type AudioProvider, type PlaybackDevice } from './AudioProvider';

const API = 'https://api.spotify.com/v1';
const URI_CACHE_KEY = 'mmq.spotify.uris';

interface SpotifyDevice {
  id: string | null;
  name: string;
  type: string;
  is_active: boolean;
  is_restricted: boolean;
}

async function api(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const token = await getAccessToken(retried);
  if (!token) throw new AudioError('auth', 'Bitte bei Spotify anmelden');
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (response.status === 401 && !retried) return api(path, init, true);
  if (response.ok) return response;

  const message = await response
    .json()
    .then((body: { error?: { message?: string } }) => body.error?.message ?? '')
    .catch(() => '');
  if (response.status === 401) throw new AudioError('auth', 'Spotify-Anmeldung abgelaufen');
  if (response.status === 403) {
    throw new AudioError(
      'premium',
      `Spotify verweigert die Wiedergabe (Premium nötig?) ${message}`,
    );
  }
  if (response.status === 404) {
    throw new AudioError(
      'no-device',
      'Kein aktives Spotify-Gerät gefunden – Spotify auf dem Gerät öffnen und Geräte aktualisieren',
    );
  }
  throw new AudioError('unknown', `Spotify-Fehler ${response.status} ${message}`);
}

/** Finds the Spotify track for a song (cached). Pinned `spotifyUri` wins. */
async function resolveUri(song: Song): Promise<string> {
  if (song.spotifyUri) return song.spotifyUri;
  const cache = readJson<Record<string, string>>(URI_CACHE_KEY) ?? {};
  if (cache[song.id]) return cache[song.id];

  const query = `track:${song.title} artist:${song.artist}`;
  const response = await api(
    `/search?${new URLSearchParams({ q: query, type: 'track', limit: '1' })}`,
  );
  const data = (await response.json()) as { tracks: { items: { uri: string }[] } };
  const uri = data.tracks.items[0]?.uri;
  if (!uri) throw new AudioError('not-found', `„${song.title}“ nicht auf Spotify gefunden`);
  writeJson(URI_CACHE_KEY, { ...cache, [song.id]: uri });
  return uri;
}

export function createSpotifyProvider(): AudioProvider {
  let deviceId: string | null = null;
  const deviceQuery = () => (deviceId ? `?${new URLSearchParams({ device_id: deviceId })}` : '');

  return {
    kind: 'spotify',

    async listDevices(): Promise<PlaybackDevice[]> {
      const response = await api('/me/player/devices');
      const data = (await response.json()) as { devices: SpotifyDevice[] };
      return data.devices
        .filter((d): d is SpotifyDevice & { id: string } => d.id !== null && !d.is_restricted)
        .map((d) => ({ id: d.id, name: d.name, type: d.type, isActive: d.is_active }));
    },

    selectDevice(id) {
      deviceId = id;
    },

    async play(song) {
      const uri = await resolveUri(song);
      await api(`/me/player/play${deviceQuery()}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [uri], position_ms: 0 }),
      });
    },

    async pause() {
      try {
        await api(`/me/player/pause${deviceQuery()}`, { method: 'PUT' });
      } catch (e) {
        // pausing when nothing plays returns an error – not worth bothering the players
        if ((e as AudioError).code !== 'unknown' && (e as AudioError).code !== 'no-device') throw e;
      }
    },
  };
}
