import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer } from './engine';
import type { GameAction, GameState, Song } from './types';

const song = (year: number, id = String(year)): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'X',
  year,
  genre: 'Pop',
});

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

function start(years: number[], target = 10): GameState {
  return gameReducer(createInitialState(), {
    type: 'start',
    teamNames: ['A', 'B'],
    songs: years.map((y, i) => song(y, `s${i}`)),
    target,
  });
}

describe('gameReducer', () => {
  it('starts in the opening phase with the first song', () => {
    const state = start([1980, 1990]);
    expect(state.phase).toBe('opening');
    expect(state.current?.year).toBe(1980);
    expect(state.deck).toHaveLength(1);
  });

  it('finishes immediately without songs', () => {
    const state = start([]);
    expect(state.phase).toBe('finished');
    expect(state.winner).toBe('draw');
  });

  it('gives the opening song to the claiming team and lets the other team play next', () => {
    const state = run(start([1980, 1990]), { type: 'claimOpening', team: 1 });
    expect(state.phase).toBe('revealed');
    expect(state.teams[1].timeline.map((s) => s.year)).toEqual([1980]);

    const next = gameReducer(state, { type: 'next' });
    expect(next.phase).toBe('placing');
    expect(next.activeTeam).toBe(0);
    expect(next.current?.year).toBe(1990);
  });

  it('discards an unclaimed opening song and stays in the opening phase', () => {
    const state = run(
      start([1980, 1990, 2000]),
      { type: 'claimOpening', team: null },
      { type: 'next' },
    );
    expect(state.phase).toBe('opening');
    expect(state.discarded.map((s) => s.year)).toEqual([1980]);
    expect(state.current?.year).toBe(1990);
  });

  it('accepts any placement on an empty timeline (first turn of the other team)', () => {
    const state = run(
      start([1980, 1990]),
      { type: 'claimOpening', team: 0 },
      { type: 'next' },
      { type: 'place', index: 0 },
    );
    expect(state.result).toMatchObject({ type: 'placement', team: 1, correct: true });
    expect(state.teams[1].timeline).toHaveLength(1);
  });

  it('keeps correct placements sorted and discards wrong ones, alternating teams', () => {
    let state = run(
      start([1980, 1990, 1970, 1960, 2000]),
      { type: 'claimOpening', team: 0 }, // A: [1980]
      { type: 'next' }, // B places 1990
      { type: 'place', index: 0 }, // B: [1990]
      { type: 'next' }, // A places 1970
      { type: 'place', index: 0 }, // correct: A: [1970, 1980]
    );
    expect(state.teams[0].timeline.map((s) => s.year)).toEqual([1970, 1980]);

    state = run(state, { type: 'next' }, { type: 'place', index: 1 }); // B: 1960 after 1990 → wrong
    expect(state.result).toMatchObject({ team: 1, correct: false });
    expect(state.teams[1].timeline.map((s) => s.year)).toEqual([1990]);
    expect(state.discarded.map((s) => s.year)).toEqual([1960]);

    state = run(state, { type: 'next' });
    expect(state.activeTeam).toBe(0);
    expect(state.current?.year).toBe(2000);
  });

  it('ends when a team reaches the target', () => {
    const state = run(
      start([1980, 1990, 1970, 2000], 2),
      { type: 'claimOpening', team: 0 },
      { type: 'next' },
      { type: 'place', index: 0 }, // B: 1
      { type: 'next' },
      { type: 'place', index: 0 }, // A: 2 → target reached
      { type: 'next' },
    );
    expect(state.phase).toBe('finished');
    expect(state.winner).toBe(0);
    expect(state.current).toBeNull();
  });

  it('ends when the deck is empty and picks the team with more cards', () => {
    const state = run(
      start([1980, 1990]),
      { type: 'claimOpening', team: 0 },
      { type: 'next' },
      { type: 'place', index: 0 },
      { type: 'next' },
    );
    expect(state.phase).toBe('finished');
    expect(state.winner).toBe('draw');
  });

  it('ignores actions in the wrong phase', () => {
    const state = start([1980, 1990]);
    expect(gameReducer(state, { type: 'place', index: 0 })).toBe(state);
    expect(gameReducer(state, { type: 'next' })).toBe(state);
  });
});
