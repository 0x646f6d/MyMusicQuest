import type { Song } from '../game/types';
import songsJson from './songs.json';

export const allSongs: Song[] = songsJson;

export interface SongFilter {
  /** Empty = all genres. */
  genres: string[];
  /** Decade start years, e.g. 1980. Empty = all decades. */
  decades: number[];
}

export const decadeOf = (year: number): number => Math.floor(year / 10) * 10;

export function listGenres(songs: Song[]): string[] {
  return [...new Set(songs.map((s) => s.genre))].sort((a, b) => a.localeCompare(b, 'de'));
}

export function listDecades(songs: Song[]): number[] {
  return [...new Set(songs.map((s) => decadeOf(s.year)))].sort((a, b) => a - b);
}

export function filterSongs(songs: Song[], filter: SongFilter): Song[] {
  return songs.filter(
    (s) =>
      (filter.genres.length === 0 || filter.genres.includes(s.genre)) &&
      (filter.decades.length === 0 || filter.decades.includes(decadeOf(s.year))),
  );
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
