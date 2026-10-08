import { useEffect } from 'react';

/**
 * Keeps the tablet screen on while the component is mounted (where supported).
 * The browser drops the lock when the page is hidden or e.g. battery saver kicks
 * in, so it is re-requested when the page becomes visible again and on the next
 * tap (Safari may only grant it after a user gesture).
 */
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let pending = false;
    let disposed = false;
    const request = async () => {
      if (disposed || pending || (lock && !lock.released)) return;
      if (document.visibilityState !== 'visible') return;
      pending = true;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (disposed) void next.release();
        else lock = next;
      } catch {
        // not allowed right now – retried on the next tap or visibility change
      } finally {
        pending = false;
      }
    };
    const onEvent = () => void request();
    void request();
    document.addEventListener('visibilitychange', onEvent);
    document.addEventListener('pointerdown', onEvent);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onEvent);
      document.removeEventListener('pointerdown', onEvent);
      void lock?.release();
    };
  }, []);
}
