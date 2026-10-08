import { useFullscreen } from './useFullscreen';

/** Toggles fullscreen; hidden where the browser can't (e.g. iPhone, installed PWA on iOS). */
export function FullscreenButton({ className = 'btn small' }: { className?: string }) {
  const { supported, active, toggle } = useFullscreen();
  if (!supported) return null;
  return (
    <button type="button" className={className} onClick={toggle} aria-pressed={active}>
      {active ? 'Vollbild beenden' : 'Vollbild'}
    </button>
  );
}
