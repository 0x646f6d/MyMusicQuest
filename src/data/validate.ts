import type { Song } from '../game/types';

const SPOTIFY_TRACK_URI = /^spotify:track:[A-Za-z0-9]{22}$/;

/** Returns a list of human-readable problems (empty = valid). */
export function validateSongs(songs: unknown[], currentYear = new Date().getFullYear()): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  songs.forEach((raw, i) => {
    const song = raw as Partial<Song>;
    const label = `#${i} (${song.id ?? '?'})`;
    for (const key of ['id', 'title', 'artist', 'genre'] as const) {
      if (typeof song[key] !== 'string' || !song[key]?.trim())
        problems.push(`${label}: ${key} fehlt`);
    }
    if (!Number.isInteger(song.year) || song.year! < 1900 || song.year! > currentYear) {
      problems.push(`${label}: ungültiges Jahr ${song.year}`);
    }
    if (song.spotifyUri !== undefined && !SPOTIFY_TRACK_URI.test(song.spotifyUri)) {
      problems.push(`${label}: ungültige spotifyUri ${song.spotifyUri}`);
    }
    if (song.id) {
      if (ids.has(song.id)) problems.push(`${label}: doppelte id`);
      ids.add(song.id);
    }
  });
  return problems;
}
