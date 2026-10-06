import type { AudioProvider } from './AudioProvider';

/** No audio: the music is played manually (or the app is tested without Spotify). */
export function createMockProvider(): AudioProvider {
  return {
    kind: 'mock',
    listDevices: async () => [],
    selectDevice: () => {},
    play: async () => {},
    pause: async () => {},
  };
}
