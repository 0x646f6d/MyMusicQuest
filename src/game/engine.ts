import { insertAt, isPlacementCorrect } from './rules';
import type { GameAction, GameState, TeamIndex, Team } from './types';

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
    result: null,
    winner: null,
  };
}

const other = (team: TeamIndex): TeamIndex => (team === 0 ? 1 : 0);

function withTeam(teams: [Team, Team], index: TeamIndex, team: Team): [Team, Team] {
  return index === 0 ? [team, teams[1]] : [teams[0], team];
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
      if (state.phase !== 'placing' || !state.current) return state;
      const team = state.teams[state.activeTeam];
      const correct = isPlacementCorrect(team.timeline, action.index, state.current.year);
      const result = {
        type: 'placement',
        team: state.activeTeam,
        index: action.index,
        correct,
      } as const;
      if (!correct) {
        return {
          ...state,
          phase: 'revealed',
          discarded: [...state.discarded, state.current],
          result,
        };
      }
      return {
        ...state,
        phase: 'revealed',
        teams: withTeam(state.teams, state.activeTeam, {
          ...team,
          timeline: insertAt(team.timeline, action.index, state.current),
        }),
        result,
      };
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
        result: null,
      };
    }
  }
}
