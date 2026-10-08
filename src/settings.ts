import { allSongs, listGenres } from './data/pool';
import { DEFAULT_TARGET } from './game/engine';
import { readJson, writeJson } from './storage';

export type AudioMode = 'spotify' | 'mock';
/** 'table': tablet lies between the teams, one screen half per team. */
export type Layout = 'table' | 'classic';

export interface Settings {
  teamNames: [string, string];
  target: number;
  /** Challenge tokens per team (0 = no challenges). */
  challengeTokens: number;
  genres: string[];
  decades: number[];
  audio: AudioMode;
  deviceId: string | null;
  layout: Layout;
}

const KEY = 'mmq.settings';

export const defaultSettings: Settings = {
  teamNames: ['Team A', 'Team B'],
  target: DEFAULT_TARGET,
  challengeTokens: 3,
  genres: [],
  decades: [],
  audio: 'spotify',
  deviceId: null,
  layout: 'table',
};

export function loadSettings(): Settings {
  const settings = { ...defaultSettings, ...readJson<Settings>(KEY) };
  // Drop genres that no longer exist in songs.json (e.g. after the song list changed).
  const known = listGenres(allSongs);
  return { ...settings, genres: settings.genres.filter((g) => known.includes(g)) };
}

export const saveSettings = (settings: Settings): void => writeJson(KEY, settings);
