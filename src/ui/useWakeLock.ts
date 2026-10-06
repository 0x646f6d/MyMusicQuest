import { useEffect } from 'react';

/** Keeps the tablet screen on while the component is mounted (where supported). */
export function useWakeLock(): void {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let disposed = false;
    const request = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        lock = await navigator.wakeLock.request('screen');
        if (disposed) void lock.release();
      } catch {
        // not allowed (e.g. battery saver) – nothing to do
      }
    };
    void request();
    document.addEventListener('visibilitychange', request);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', request);
      void lock?.release();
    };
  }, []);
}
