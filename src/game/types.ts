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

export type Phase = 'opening' | 'placing' | 'revealed' | 'finished';

export type RoundResult =
  | { type: 'opening'; team: TeamIndex | null }
  | { type: 'placement'; team: TeamIndex; index: number; correct: boolean };

export interface GameState {
  phase: Phase;
  teams: [Team, Team];
  /** Team whose turn it is (only meaningful in 'placing' and 'revealed'). */
  activeTeam: TeamIndex;
  /** Song currently being played, null when the game is over. */
  current: Song | null;
  /** Songs still to be played, next one first. */
  deck: Song[];
  discarded: Song[];
  /** Number of cards needed to win. */
  target: number;
  result: RoundResult | null;
  winner: TeamIndex | 'draw' | null;
}

export type GameAction =
  | { type: 'start'; teamNames: [string, string]; songs: Song[]; target: number }
  | { type: 'claimOpening'; team: TeamIndex | null }
  | { type: 'place'; index: number }
  | { type: 'next' };
