import { insertAt, insertSorted, isPlacementCorrect } from './rules';
import type { Challenge, GameAction, GameState, RoundResult, TeamIndex, Team } from './types';

export const DEFAULT_TARGET = 10;

export function createInitialState(): GameState {
  return {
    phase: 'finished',
    teams: [
      { name: 'Team A', timeline: [] },
      { name: 'Team B', timeline: [] },
    ],
    activeTeam: 0,
    current: null,
    deck: [],
    discarded: [],
    target: DEFAULT_TARGET,
    placement: null,
    tokens: [0, 0],
    result: null,
    winner: null,
  };
}

export const other = (team: TeamIndex): TeamIndex => (team === 0 ? 1 : 0);

function withTeam(teams: [Team, Team], index: TeamIndex, team: Team): [Team, Team] {
  return index === 0 ? [team, teams[1]] : [teams[0], team];
}

/** Challenge tokens left for `team` (0 for games saved before challenges existed). */
export const tokensOf = (state: GameState, team: TeamIndex): number => state.tokens?.[team] ?? 0;

/** Can the team that is not on turn still challenge? */
export const canChallenge = (state: GameState): boolean =>
  tokensOf(state, other(state.activeTeam)) > 0;

/** Team that got the card in this round, or null if it was discarded. */
export function cardOwner(result: RoundResult): TeamIndex | null {
  if (result.type === 'opening') return result.team;
  // results saved before challenges existed have no winner
  return result.winner !== undefined ? result.winner : result.correct ? result.team : null;
}

/**
 * Reveals the current song placed at gap `index` by the active team, optionally
 * challenged by the other team at gap `challengeIndex` of the same timeline.
 * The active team wins ties; a challenger only gets the card if the active team was wrong.
 */
function resolve(state: GameState, index: number, challengeIndex: number | null): GameState {
  const current = state.current!;
  const active = state.activeTeam;
  const team = state.teams[active];
  const correct = isPlacementCorrect(team.timeline, index, current.year);
  const challenge: Challenge | undefined =
    challengeIndex === null
      ? undefined
      : {
          team: other(active),
          index: challengeIndex,
          correct: isPlacementCorrect(team.timeline, challengeIndex, current.year),
        };
  const winner = correct ? active : challenge?.correct ? challenge.team : null;
  let teams = state.teams;
  if (winner === active) {
    teams = withTeam(teams, active, {
      ...team,
      timeline: insertAt(team.timeline, index, current),
    });
  } else if (winner !== null) {
    const challenger = teams[winner];
    teams = withTeam(teams, winner, {
      ...challenger,
      timeline: insertSorted(challenger.timeline, current),
    });
  }
  return {
    ...state,
    phase: 'revealed',
    teams,
    placement: null,
    discarded: winner === null ? [...state.discarded, current] : state.discarded,
    result: { type: 'placement', team: active, index, correct, challenge, winner },
  };
}

function decideWinner(teams: [Team, Team]): TeamIndex | 'draw' {
  const [a, b] = teams.map((t) => t.timeline.length);
  return a === b ? 'draw' : a > b ? 0 : 1;
}

function finish(state: GameState): GameState {
  return { ...state, phase: 'finished', current: null, winner: decideWinner(state.teams) };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start': {
      const [first, ...deck] = action.songs;
      const base: GameState = {
        ...createInitialState(),
        teams: [
          { name: action.teamNames[0], timeline: [] },
          { name: action.teamNames[1], timeline: [] },
        ],
        target: action.target,
        tokens: [action.tokens ?? 0, action.tokens ?? 0],
      };
      if (!first) return finish(base);
      return { ...base, phase: 'opening', current: first, deck };
    }

    case 'claimOpening': {
      if (state.phase !== 'opening' || !state.current) return state;
      if (action.team === null) {
        return {
          ...state,
          phase: 'revealed',
          discarded: [...state.discarded, state.current],
          result: { type: 'opening', team: null },
        };
      }
      const team = state.teams[action.team];
      return {
        ...state,
        phase: 'revealed',
        activeTeam: action.team,
        teams: withTeam(state.teams, action.team, { ...team, timeline: [state.current] }),
        result: { type: 'opening', team: action.team },
      };
    }

    case 'place': {
      if ((state.phase !== 'placing' && state.phase !== 'pending') || !state.current) return state;
      const { timeline } = state.teams[state.activeTeam];
      if (action.index < 0 || action.index > timeline.length) return state;
      // first card of a team can't be wrong, so there is nothing to challenge
      if (canChallenge(state) && timeline.length > 0) {
        return { ...state, phase: 'pending', placement: action.index };
      }
      return resolve(state, action.index, null);
    }

    case 'reveal': {
      if (state.phase !== 'pending' || state.placement === null) return state;
      return resolve(state, state.placement, null);
    }

    case 'challenge': {
      if (state.phase !== 'pending' || state.placement === null || !canChallenge(state)) {
        return state;
      }
      const { timeline } = state.teams[state.activeTeam];
      if (action.index === state.placement || action.index < 0 || action.index > timeline.length) {
        return state;
      }
      const challenger = other(state.activeTeam);
      const tokens: [number, number] = [tokensOf(state, 0), tokensOf(state, 1)];
      tokens[challenger] -= 1;
      return resolve({ ...state, tokens }, state.placement, action.index);
    }

    case 'next': {
      if (state.phase !== 'revealed' || !state.result) return state;
      if (state.teams.some((t) => t.timeline.length >= state.target)) return finish(state);
      const [next, ...deck] = state.deck;
      if (!next) return finish(state);
      const openingUnclaimed = state.result.type === 'opening' && state.result.team === null;
      return {
        ...state,
        phase: openingUnclaimed ? 'opening' : 'placing',
        activeTeam: openingUnclaimed ? state.activeTeam : other(state.activeTeam),
        current: next,
        deck,
        placement: null,
        result: null,
      };
    }
  }
}
