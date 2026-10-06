import { DEFAULT_TARGET } from './game/engine';
import { readJson, writeJson } from './storage';

export type AudioMode = 'spotify' | 'mock';

export interface Settings {
  teamNames: [string, string];
  target: number;
  genres: string[];
  decades: number[];
  audio: AudioMode;
  deviceId: string | null;
}

const KEY = 'mmq.settings';

export const defaultSettings: Settings = {
  teamNames: ['Team A', 'Team B'],
  target: DEFAULT_TARGET,
  genres: [],
  decades: [],
  audio: 'spotify',
  deviceId: null,
};

export const loadSettings = (): Settings => ({ ...defaultSettings, ...readJson<Settings>(KEY) });
export const saveSettings = (settings: Settings): void => writeJson(KEY, settings);
