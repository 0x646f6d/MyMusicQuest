import type { Song } from '../game/types';

export interface PlaybackDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export type AudioErrorCode = 'no-device' | 'auth' | 'premium' | 'not-found' | 'unknown';

export class AudioError extends Error {
  constructor(
    public readonly code: AudioErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** Plays songs somewhere (a Spotify Connect device, or nowhere for the mock). */
export interface AudioProvider {
  readonly kind: 'spotify' | 'mock';
  listDevices(): Promise<PlaybackDevice[]>;
  selectDevice(id: string | null): void;
  play(song: Song): Promise<void>;
  pause(): Promise<void>;
}
