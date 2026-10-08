import { useCallback, useSyncExternalStore } from 'react';

// Safari on iPad only ships the prefixed API on older versions.
interface WebkitDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}
interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

const doc = () => document as WebkitDocument;

const isSupported = () => Boolean(doc().fullscreenEnabled || doc().webkitFullscreenEnabled);
const isActive = () => Boolean(doc().fullscreenElement ?? doc().webkitFullscreenElement);

function subscribe(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange);
  document.addEventListener('webkitfullscreenchange', onChange);
  return () => {
    document.removeEventListener('fullscreenchange', onChange);
    document.removeEventListener('webkitfullscreenchange', onChange);
  };
}

/** Fullscreen state of the whole page plus a toggle (no-op where unsupported). */
export function useFullscreen(): { supported: boolean; active: boolean; toggle: () => void } {
  const active = useSyncExternalStore(subscribe, isActive, () => false);
  const toggle = useCallback(() => {
    const d = doc();
    const el = document.documentElement as WebkitElement;
    // errors (e.g. denied without user gesture) leave the state unchanged
    if (isActive()) {
      void Promise.resolve(
        d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.(),
      ).catch(() => {});
    } else {
      void Promise.resolve(
        el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.(),
      ).catch(() => {});
    }
  }, []);
  return { supported: isSupported(), active, toggle };
}
