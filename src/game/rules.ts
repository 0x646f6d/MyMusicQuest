import type { Song } from './types';

/**
 * Is a song with `year` correctly placed at gap `index` of `timeline`?
 * Gap 0 is before the first card, gap `timeline.length` after the last one.
 * Equal years count as correct on both sides (>= / <=).
 */
export function isPlacementCorrect(timeline: Song[], index: number, year: number): boolean {
  if (index < 0 || index > timeline.length) return false;
  const left = timeline[index - 1];
  const right = timeline[index];
  return (!left || left.year <= year) && (!right || year <= right.year);
}

/** Inserts `song` at gap `index`, returning a new array. */
export function insertAt(timeline: Song[], index: number, song: Song): Song[] {
  return [...timeline.slice(0, index), song, ...timeline.slice(index)];
}
