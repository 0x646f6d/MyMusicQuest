import { describe, expect, it } from 'vitest';
import { allSongs, filterSongs, listDecades, shuffle } from './pool';
import { validateSongs } from './validate';

describe('songs.json', () => {
  it('is valid', () => {
    expect(validateSongs(allSongs)).toEqual([]);
  });

  it('has 40 songs spread over several decades', () => {
    expect(allSongs).toHaveLength(40);
    expect(listDecades(allSongs).length).toBeGreaterThanOrEqual(6);
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
    const result = filterSongs(allSongs, { genres: ['Austropop'], decades: [1980] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.genre === 'Austropop' && s.year >= 1980 && s.year < 1990)).toBe(
      true,
    );
    expect(filterSongs(allSongs, { genres: [], decades: [] })).toHaveLength(allSongs.length);
  });

  it('shuffles without losing items', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items, () => 0);
    expect([...result].sort()).toEqual(items);
    expect(result).not.toBe(items);
  });
});
