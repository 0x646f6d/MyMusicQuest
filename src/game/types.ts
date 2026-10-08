export interface Song {
  id: string;
  title: string;
  artist: string;
  /** Original release year (manually verified, not taken from Spotify). */
  year: number;
  genre: string;
  /** Optional: pin an exact Spotify track. Otherwise it is resolved via search. */
  spotifyUri?: string;
}

export type TeamIndex = 0 | 1;

export interface Team {
  name: string;
  /** Always sorted by year (ascending). */
  timeline: Song[];
}

/** 'pending': the active team has placed the song tentatively, the other team may challenge. */
export type Phase = 'opening' | 'placing' | 'pending' | 'revealed' | 'finished';

export interface Challenge {
  team: TeamIndex;
  /** Gap in the active team's timeline the challenging team picked. */
  index: number;
  correct: boolean;
}

export type RoundResult =
  | { type: 'opening'; team: TeamIndex | null }
  | {
      type: 'placement';
      team: TeamIndex;
      index: number;
      correct: boolean;
      challenge?: Challenge;
      /** Team that got the card (missing in results saved before challenges existed). */
      winner?: TeamIndex | null;
    };

export interface GameState {
  phase: Phase;
  teams: [Team, Team];
  /** Team whose turn it is (only meaningful in 'placing', 'pending' and 'revealed'). */
  activeTeam: TeamIndex;
  /** Song currently being played, null when the game is over. */
  current: Song | null;
  /** Songs still to be played, next one first. */
  deck: Song[];
  discarded: Song[];
  /** Number of cards needed to win. */
  target: number;
  /** Tentative gap picked by the active team (phase 'pending'). */
  placement: number | null;
  /** Challenge tokens left per team. Missing in games saved before challenges existed. */
  tokens?: [number, number];
  result: RoundResult | null;
  winner: TeamIndex | 'draw' | null;
}

export type GameAction =
  | {
      type: 'start';
      teamNames: [string, string];
      songs: Song[];
      target: number;
      /** Challenge tokens per team (0 = no challenges). */
      tokens?: number;
    }
  | { type: 'claimOpening'; team: TeamIndex | null }
  | { type: 'place'; index: number }
  | { type: 'reveal' }
  | { type: 'challenge'; index: number }
  | { type: 'next' };
