import type { Song } from '../game/types';
import { readJson, remove, writeJson } from '../storage';
import { shuffle } from './pool';

const KEY = 'mmq.played';
/** Upper bound so the list cannot grow forever (song ids are ~30 bytes). */
const MAX_ENTRIES = 5000;

/** Ids of songs played on this device, oldest first. */
export function loadPlayed(): string[] {
  const played = readJson<unknown>(KEY);
  return Array.isArray(played) ? played.filter((id) => typeof id === 'string') : [];
}

/** Moves the song to the end of the history (= most recently played). */
export function markPlayed(id: string): void {
  const played = loadPlayed().filter((p) => p !== id);
  played.push(id);
  writeJson(KEY, played.slice(-MAX_ENTRIES));
}

export function clearPlayed(): void {
  remove(KEY);
}

/**
 * Deck order for a new game: never-played songs first (shuffled), then
 * already played ones, least recently played first. So a song only comes
 * back once everything else in the current selection has been played.
 */
export function orderForDeck(
  songs: Song[],
  played: string[],
  random: () => number = Math.random,
): Song[] {
  const lastPlayed = new Map(played.map((id, i) => [id, i]));
  const shuffled = shuffle(songs, random);
  const fresh = shuffled.filter((s) => !lastPlayed.has(s.id));
  const seen = shuffled
    .filter((s) => lastPlayed.has(s.id))
    .sort((a, b) => lastPlayed.get(a.id)! - lastPlayed.get(b.id)!);
  return [...fresh, ...seen];
}
