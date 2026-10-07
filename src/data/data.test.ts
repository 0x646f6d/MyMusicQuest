import { describe, expect, it } from 'vitest';
import { allSongs, filterSongs, listDecades, listGenres, shuffle } from './pool';
import { validateSongs } from './validate';

describe('songs.json', () => {
  it('is valid', () => {
    expect(validateSongs(allSongs)).toEqual([]);
  });

  it('has only Rock and Pop songs spread over several decades', () => {
    expect(allSongs.length).toBeGreaterThan(1000);
    expect(listGenres(allSongs)).toEqual(['Pop', 'Rock']);
    expect(listDecades(allSongs).length).toBeGreaterThanOrEqual(6);
  });

  it('has no song twice (same title and artist)', () => {
    const key = (s: (typeof allSongs)[number]) =>
      `${s.title}|${s.artist}`
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9|]/g, '');
    expect(new Set(allSongs.map(key)).size).toBe(allSongs.length);
  });
});

describe('validateSongs', () => {
  it('reports missing fields, bad years, bad URIs and duplicates', () => {
    const problems = validateSongs([
      { id: 'a', title: 'T', artist: 'A', year: 1800, genre: 'Pop' },
      { id: 'a', title: '', artist: 'A', year: 2000, genre: 'Pop', spotifyUri: 'nope' },
    ]);
    expect(problems).toHaveLength(4);
  });
});

describe('pool', () => {
  it('filters by genre and decade', () => {
    const result = filterSongs(allSongs, { genres: ['Rock'], decades: [1980] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.genre === 'Rock' && s.year >= 1980 && s.year < 1990)).toBe(true);
    expect(filterSongs(allSongs, { genres: [], decades: [] })).toHaveLength(allSongs.length);
  });

  it('shuffles without losing items', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items, () => 0);
    expect([...result].sort()).toEqual(items);
    expect(result).not.toBe(items);
  });
});
