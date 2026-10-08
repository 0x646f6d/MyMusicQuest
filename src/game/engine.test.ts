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

function start(years: number[], target = 10, tokens = 0): GameState {
  return gameReducer(createInitialState(), {
    type: 'start',
    teamNames: ['A', 'B'],
    songs: years.map((y, i) => song(y, `s${i}`)),
    target,
    tokens,
  });
}

const years = (state: GameState, team: 0 | 1) => state.teams[team].timeline.map((s) => s.year);

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

describe('challenges', () => {
  // A: [1980], B: [1990]; then A places 1970 with one token per team
  const ready = (songYears = [1980, 1990, 1970, 2000], target = 10, tokens = 1) =>
    run(
      start(songYears, target, tokens),
      { type: 'claimOpening', team: 0 },
      { type: 'next' },
      { type: 'place', index: 0 }, // B's first card is revealed immediately
      { type: 'next' },
    );

  it('reveals the first card of a team immediately', () => {
    const state = run(
      start([1980, 1990], 10, 1),
      { type: 'claimOpening', team: 0 },
      { type: 'next' },
      { type: 'place', index: 0 },
    );
    expect(state.phase).toBe('revealed');
  });

  it('places tentatively while the other team has tokens', () => {
    let state = gameReducer(ready(), { type: 'place', index: 1 });
    expect(state.phase).toBe('pending');
    expect(state.placement).toBe(1);
    expect(years(state, 0)).toEqual([1980]);

    state = gameReducer(state, { type: 'place', index: 0 }); // change of mind
    expect(state.placement).toBe(0);

    state = gameReducer(state, { type: 'reveal' });
    expect(state.phase).toBe('revealed');
    expect(state.result).toMatchObject({ correct: true, winner: 0 });
    expect(state.result).not.toHaveProperty('challenge.team');
    expect(years(state, 0)).toEqual([1970, 1980]);
    expect(state.tokens).toEqual([1, 1]);
  });

  it('reveals immediately without tokens', () => {
    const state = gameReducer(ready(undefined, undefined, 0), { type: 'place', index: 1 });
    expect(state.phase).toBe('revealed');
  });

  it('gives the card to a successful challenger, sorted into its timeline', () => {
    const state = run(ready(), { type: 'place', index: 1 }, { type: 'challenge', index: 0 });
    expect(state.result).toMatchObject({
      correct: false,
      challenge: { team: 1, index: 0, correct: true },
      winner: 1,
    });
    expect(years(state, 0)).toEqual([1980]);
    expect(years(state, 1)).toEqual([1970, 1990]);
    expect(state.tokens).toEqual([1, 0]);
    expect(state.discarded).toHaveLength(0);
  });

  it('costs a token and keeps the card with the active team when it was right', () => {
    const state = run(ready(), { type: 'place', index: 0 }, { type: 'challenge', index: 1 });
    expect(state.result).toMatchObject({ correct: true, challenge: { correct: false }, winner: 0 });
    expect(years(state, 0)).toEqual([1970, 1980]);
    expect(years(state, 1)).toEqual([1990]);
    expect(state.tokens).toEqual([1, 0]);
  });

  it('lets the active team win ties', () => {
    // A: [1980], places another 1980 before it, B challenges after it: both correct
    const state = run(
      ready([1980, 1990, 1980]),
      { type: 'place', index: 0 },
      { type: 'challenge', index: 1 },
    );
    expect(state.result).toMatchObject({ correct: true, challenge: { correct: true }, winner: 0 });
    expect(years(state, 1)).toEqual([1990]);
  });

  it('discards the card when both are wrong', () => {
    // A: [1980, 1990] after a second round, then 1985 placed before 1980, challenged after 1990
    let state = run(
      ready([1980, 1990, 1990, 1960, 1985]),
      { type: 'place', index: 1 },
      { type: 'reveal' }, // A: [1980, 1990]
      { type: 'next' },
      { type: 'place', index: 1 }, // B: 1960 after 1990, A has a token
      { type: 'reveal' }, // wrong
      { type: 'next' },
      { type: 'place', index: 0 },
    );
    expect(state.phase).toBe('pending');
    state = gameReducer(state, { type: 'challenge', index: 2 });
    expect(state.result).toMatchObject({
      correct: false,
      challenge: { correct: false },
      winner: null,
    });
    expect(state.discarded.map((s) => s.year)).toEqual([1960, 1985]);
  });

  it('ignores invalid challenges', () => {
    const pending = gameReducer(ready(), { type: 'place', index: 1 });
    expect(gameReducer(pending, { type: 'challenge', index: 1 })).toBe(pending);
    expect(gameReducer(pending, { type: 'challenge', index: 5 })).toBe(pending);
    const noTokens = { ...pending, tokens: [1, 0] as [number, number] };
    expect(gameReducer(noTokens, { type: 'challenge', index: 0 })).toBe(noTokens);
    expect(gameReducer(ready(), { type: 'challenge', index: 0 })).toEqual(ready());
  });

  it('lets a team win through a challenge', () => {
    const state = run(
      ready(undefined, 2),
      { type: 'place', index: 1 },
      { type: 'challenge', index: 0 },
      { type: 'next' },
    );
    expect(state.phase).toBe('finished');
    expect(state.winner).toBe(1);
  });

  it('treats games saved without tokens as having none', () => {
    const { tokens: _, ...old } = ready(undefined, undefined, 1);
    void _;
    const state = gameReducer(old, { type: 'place', index: 1 });
    expect(state.phase).toBe('revealed');
  });
});

describe('bonus token for title and artist', () => {
  // A: [1980], B places its first card (1990) and it is revealed
  const revealed = (tokens = 1) =>
    run(
      start([1980, 1990, 1970], 10, tokens),
      { type: 'claimOpening', team: 0 },
      { type: 'next' },
      { type: 'place', index: 0 },
    );

  it('gives each team one extra token per round', () => {
    let state = run(revealed(), { type: 'bonus', team: 1 }, { type: 'bonus', team: 0 });
    expect(state.tokens).toEqual([2, 2]);
    expect(gameReducer(state, { type: 'bonus', team: 1 })).toBe(state);

    state = run(state, { type: 'next' }, { type: 'place', index: 0 }, { type: 'reveal' });
    expect(gameReducer(state, { type: 'bonus', team: 0 }).tokens).toEqual([3, 2]);
  });

  it('is only available after a placement was revealed', () => {
    const opening = start([1980, 1990], 10, 1);
    expect(gameReducer(opening, { type: 'bonus', team: 0 })).toBe(opening);
    const claimed = gameReducer(opening, { type: 'claimOpening', team: 0 });
    expect(gameReducer(claimed, { type: 'bonus', team: 0 })).toBe(claimed);
    const placing = gameReducer(claimed, { type: 'next' });
    expect(gameReducer(placing, { type: 'bonus', team: 1 })).toBe(placing);
  });

  it('is disabled without challenges', () => {
    const state = revealed(0);
    expect(gameReducer(state, { type: 'bonus', team: 1 })).toBe(state);
  });
});
