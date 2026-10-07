import { beforeEach, describe, expect, it } from 'vitest';
import type { Song } from '../game/types';
import { clearPlayed, loadPlayed, markPlayed, orderForDeck } from './history';

const song = (id: string): Song => ({ id, title: id, artist: 'A', year: 2000, genre: 'Pop' });

describe('orderForDeck', () => {
  it('puts unplayed songs first, then played ones least recently played first', () => {
    const songs = ['a', 'b', 'c', 'd', 'e'].map(song);
    const deck = orderForDeck(songs, ['d', 'x', 'b'], Math.random);
    expect(
      deck
        .slice(0, 3)
        .map((s) => s.id)
        .sort(),
    ).toEqual(['a', 'c', 'e']);
    expect(deck.slice(3).map((s) => s.id)).toEqual(['d', 'b']);
  });
});

describe('played history', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    } as Storage;
  });

  it('records songs, moving repeats to the end', () => {
    markPlayed('a');
    markPlayed('b');
    markPlayed('a');
    expect(loadPlayed()).toEqual(['b', 'a']);
    clearPlayed();
    expect(loadPlayed()).toEqual([]);
  });
});
