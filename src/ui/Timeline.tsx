import type { Song } from '../game/types';

interface Props {
  songs: Song[];
  /** Song to highlight (e.g. the card just placed). */
  highlightId?: string;
  /** If set, gaps between cards become buttons. */
  onPick?: (index: number) => void;
  compact?: boolean;
}

export function Timeline({ songs, highlightId, onPick, compact }: Props) {
  const gap = (index: number) =>
    onPick && (
      <button
        type="button"
        key={`gap-${index}`}
        className="gap"
        aria-label={gapLabel(songs, index)}
        onClick={() => onPick(index)}
      >
        +
      </button>
    );

  return (
    <ol className={`timeline ${compact ? 'compact' : ''}`}>
      {songs.length === 0 && !onPick && <li className="empty">Noch keine Karten</li>}
      {songs.map((song, i) => (
        <li key={song.id} className="slot">
          {gap(i)}
          <div className={`card ${song.id === highlightId ? 'new' : ''}`}>
            <span className="year">{song.year}</span>
            {!compact && (
              <>
                <span className="title">{song.title}</span>
                <span className="artist">{song.artist}</span>
              </>
            )}
          </div>
        </li>
      ))}
      {onPick && <li className="slot">{gap(songs.length)}</li>}
    </ol>
  );
}

function gapLabel(songs: Song[], index: number): string {
  if (songs.length === 0) return 'Hier einordnen';
  if (index === 0) return `Vor ${songs[0].year}`;
  if (index === songs.length) return `Nach ${songs[songs.length - 1].year}`;
  return `Zwischen ${songs[index - 1].year} und ${songs[index].year}`;
}
