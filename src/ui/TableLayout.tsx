import type { Dispatch, ReactNode } from 'react';
import type { GameAction, GameState, TeamIndex } from '../game/types';
import { Timeline } from './Timeline';

interface Props {
  game: GameState;
  dispatch: Dispatch<GameAction>;
  hidden: boolean;
  /** Center controls (play/pause, host hint, errors, menu). */
  controls: ReactNode;
  onNext: () => void;
  onExit: () => void;
}

/**
 * Tablet lies flat between the teams: each team gets the half of the screen
 * facing it, the far half is rotated by 180°. Shared controls sit in the middle.
 */
export function TableLayout({ game, dispatch, hidden, controls, onNext, onExit }: Props) {
  const finished = game.phase === 'finished';
  return (
    <main className="game table">
      <TeamHalf team={1} game={game} dispatch={dispatch} onNext={onNext} flipped />
      <section className="center">
        {!finished && hidden && <span className="disc">?</span>}
        {!finished && controls}
        {game.phase === 'opening' && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => dispatch({ type: 'claimOpening', team: null })}
          >
            Keiner
          </button>
        )}
        {finished && (
          <button type="button" className="btn primary big" onClick={onExit}>
            Neues Spiel
          </button>
        )}
      </section>
      <TeamHalf team={0} game={game} dispatch={dispatch} onNext={onNext} />
    </main>
  );
}

interface HalfProps {
  team: TeamIndex;
  game: GameState;
  dispatch: Dispatch<GameAction>;
  onNext: () => void;
  flipped?: boolean;
}

function TeamHalf({ team, game, dispatch, onNext, flipped }: HalfProps) {
  const { phase, teams, activeTeam, result, current } = game;
  const own = teams[team];
  const onTurn =
    (phase === 'placing' || (phase === 'revealed' && result?.type === 'placement')) &&
    activeTeam === team;

  return (
    <section
      className={`half team-${team} ${flipped ? 'flipped' : ''} ${onTurn ? 'active' : ''}`}
      aria-label={own.name}
    >
      <header className="half-head">
        <h2>{own.name}</h2>
        {onTurn && <span className="badge">Am Zug</span>}
        <span className="count">
          {own.timeline.length}
          <small>/{game.target}</small>
        </span>
      </header>

      <div className="half-status">
        {phase === 'revealed' && current && (
          <div className="reveal">
            <span className="year">{current.year}</span>
            <span className="song">
              <span className="title">{current.title}</span>
              <span className="artist">{current.artist}</span>
            </span>
          </div>
        )}
        <p className={`lead ${statusTone(game, team)}`}>{statusText(game, team)}</p>
        {phase === 'opening' && (
          <button
            type="button"
            className={`btn big team-${team}`}
            onClick={() => dispatch({ type: 'claimOpening', team })}
          >
            {own.name} wusste es
          </button>
        )}
        {phase === 'revealed' && (
          <button type="button" className="btn primary" onClick={onNext}>
            Weiter
          </button>
        )}
      </div>

      <Timeline
        songs={own.timeline}
        wrap
        highlightId={phase === 'revealed' && result?.team === team ? current?.id : undefined}
        onPick={
          phase === 'placing' && activeTeam === team
            ? (index) => dispatch({ type: 'place', index })
            : undefined
        }
      />
    </section>
  );
}

function statusTone(game: GameState, team: TeamIndex): string {
  const { phase, result, winner } = game;
  if (phase === 'revealed' && result?.type === 'placement') return result.correct ? 'good' : 'bad';
  if (phase === 'finished' && winner !== 'draw') return winner === team ? 'good' : '';
  return '';
}

/** Status line from the perspective of the team sitting at this half. */
function statusText(game: GameState, team: TeamIndex): string {
  const { phase, teams, activeTeam, result, winner } = game;
  switch (phase) {
    case 'opening':
      return 'Wer kennt Titel oder Interpret? Das Team bekommt die erste Karte.';
    case 'placing':
      return activeTeam === team
        ? 'Ihr seid dran: Wann ist das Lied erschienen? Tippt auf die passende Stelle.'
        : `${teams[activeTeam].name} ist dran.`;
    case 'revealed':
      if (!result) return '';
      if (result.type === 'opening') {
        if (result.team === null) return 'Keiner wusste es – das Lied wird verworfen.';
        return result.team === team
          ? 'Ihr bekommt die erste Karte!'
          : `${teams[result.team].name} bekommt die erste Karte!`;
      }
      if (!result.correct) return 'Leider falsch – die Karte wird verworfen.';
      return result.team === team
        ? 'Richtig! Ihr behaltet die Karte.'
        : `Richtig! ${teams[result.team].name} behält die Karte.`;
    case 'finished':
      if (winner === 'draw') return 'Unentschieden!';
      if (winner === null) return '';
      return winner === team ? 'Ihr habt gewonnen!' : `${teams[winner].name} gewinnt!`;
  }
}
