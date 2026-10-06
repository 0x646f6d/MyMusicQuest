import { useCallback, useEffect, useState } from 'react';
import type { AudioProvider, PlaybackDevice } from '../audio/AudioProvider';

interface Props {
  provider: AudioProvider;
  deviceId: string | null;
  onSelect: (id: string) => void;
}

export function DevicePicker({ provider, deviceId, onSelect }: Props) {
  const [devices, setDevices] = useState<PlaybackDevice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      provider.listDevices().then(
        (list) => {
          setDevices(list);
          setError(null);
          setLoading(false);
          const active = list.find((d) => d.isActive);
          if (!list.some((d) => d.id === deviceId) && active) onSelect(active.id);
        },
        (e: Error) => {
          setError(e.message);
          setLoading(false);
        },
      ),
    [provider, deviceId, onSelect],
  );

  const refresh = () => {
    setLoading(true);
    void load();
  };

  useEffect(() => {
    void load();
    // only on mount – later refreshes are triggered by the button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="devices">
      <div className="devices-head">
        <span>Abspielgerät</span>
        <button type="button" className="btn small" onClick={refresh} disabled={loading}>
          {loading ? 'Suche …' : 'Aktualisieren'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {devices?.length === 0 && (
        <p className="hint">
          Kein Gerät gefunden. Öffne Spotify auf dem Gerät, das spielen soll (Handy, Laptop, Box, TV
          …), und tippe „Aktualisieren“.
        </p>
      )}
      <div className="device-list">
        {devices?.map((d) => (
          <button
            type="button"
            key={d.id}
            className={`chip device ${d.id === deviceId ? 'on' : ''}`}
            aria-pressed={d.id === deviceId}
            onClick={() => onSelect(d.id)}
          >
            <strong>{d.name}</strong>
            <small>{d.type}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
