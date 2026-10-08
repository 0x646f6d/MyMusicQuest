import { useEffect, useMemo, useReducer, useState } from 'react';
import { createMockProvider } from './audio/mockProvider';
import { createSpotifyProvider } from './audio/spotifyConnect';
import { handleRedirect, isSpotifyConfigured } from './auth/spotifyAuth';
import { markPlayed } from './data/history';
import { createInitialState, gameReducer } from './game/engine';
import type { GameState, Song } from './game/types';
import { loadSettings, saveSettings, type Settings } from './settings';
import { readJson, writeJson } from './storage';
import { GameScreen } from './ui/GameScreen';
import { SetupScreen } from './ui/SetupScreen';

const GAME_KEY = 'mmq.game';

const hasGame = (game: GameState) => game.phase !== 'finished' || game.winner !== null;

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => {
    const loaded = loadSettings();
    return isSpotifyConfigured() ? loaded : { ...loaded, audio: 'mock' };
  });
  const [game, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => readJson<GameState>(GAME_KEY) ?? createInitialState(),
  );
  const [screen, setScreen] = useState<'setup' | 'game'>(() => (hasGame(game) ? 'game' : 'setup'));
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginDone, setLoginDone] = useState(false);

  useEffect(() => {
    handleRedirect().then((error) => {
      setLoginError(error);
      setLoginDone(true);
    });
  }, []);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => writeJson(GAME_KEY, game), [game]);

  // Remember every song this device has played, so new games prefer unheard songs.
  const currentId = game.current?.id;
  useEffect(() => {
    if (currentId) markPlayed(currentId);
  }, [currentId]);

  const provider = useMemo(() => {
    const p = settings.audio === 'spotify' ? createSpotifyProvider() : createMockProvider();
    p.selectDevice(settings.deviceId);
    return p;
  }, [settings.audio, settings.deviceId]);

  const startGame = (songs: Song[]) => {
    dispatch({
      type: 'start',
      teamNames: settings.teamNames,
      songs,
      target: settings.target,
      tokens: settings.challengeTokens,
    });
    setScreen('game');
  };

  if (screen === 'game' && hasGame(game)) {
    return (
      <GameScreen
        game={game}
        dispatch={dispatch}
        provider={provider}
        layout={settings.layout}
        onExit={() => setScreen('setup')}
      />
    );
  }

  return (
    <SetupScreen
      settings={settings}
      onChange={setSettings}
      onStart={startGame}
      onResume={hasGame(game) && game.phase !== 'finished' ? () => setScreen('game') : undefined}
      loginReady={loginDone}
      loginError={loginError}
    />
  );
}
