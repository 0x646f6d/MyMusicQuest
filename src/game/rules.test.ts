import { describe, expect, it } from 'vitest';
import { insertAt, insertSorted, isPlacementCorrect } from './rules';
import type { Song } from './types';

const song = (year: number): Song => ({
  id: String(year),
  title: `Song ${year}`,
  artist: 'X',
  year,
  genre: 'Pop',
});

const timeline = [song(1970), song(1985), song(2000)];

describe('isPlacementCorrect', () => {
  it('accepts any placement on an empty timeline', () => {
    expect(isPlacementCorrect([], 0, 1999)).toBe(true);
  });

  it('checks before, between and after', () => {
    expect(isPlacementCorrect(timeline, 0, 1960)).toBe(true);
    expect(isPlacementCorrect(timeline, 0, 1980)).toBe(false);
    expect(isPlacementCorrect(timeline, 2, 1990)).toBe(true);
    expect(isPlacementCorrect(timeline, 2, 2005)).toBe(false);
    expect(isPlacementCorrect(timeline, 3, 2010)).toBe(true);
    expect(isPlacementCorrect(timeline, 3, 1999)).toBe(false);
  });

  it('treats equal years as correct on both sides', () => {
    expect(isPlacementCorrect(timeline, 1, 1985)).toBe(true);
    expect(isPlacementCorrect(timeline, 2, 1985)).toBe(true);
    expect(isPlacementCorrect(timeline, 0, 1970)).toBe(true);
    expect(isPlacementCorrect(timeline, 3, 2000)).toBe(true);
  });

  it('rejects out-of-range gaps', () => {
    expect(isPlacementCorrect(timeline, -1, 1960)).toBe(false);
    expect(isPlacementCorrect(timeline, 4, 2010)).toBe(false);
  });
});

describe('insertAt', () => {
  it('inserts without mutating', () => {
    const result = insertAt(timeline, 1, song(1977));
    expect(result.map((s) => s.year)).toEqual([1970, 1977, 1985, 2000]);
    expect(timeline).toHaveLength(3);
  });
});

describe('insertSorted', () => {
  it('inserts by year, after cards of the same year', () => {
    expect(insertSorted(timeline, song(1990)).map((s) => s.year)).toEqual([1970, 1985, 1990, 2000]);
    expect(insertSorted(timeline, song(1960))[0].year).toBe(1960);
    expect(insertSorted(timeline, song(2010))[3].year).toBe(2010);
    const same = { ...song(1985), id: 'other' };
    expect(insertSorted(timeline, same)[2].id).toBe('other');
  });
});
