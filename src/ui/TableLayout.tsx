import { useState, type Dispatch, type ReactNode } from 'react';
import { cardOwner, other, tokensOf } from '../game/engine';
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
  // id of the song the other team is challenging, so the mode ends with the round
  const [challengedId, setChallengedId] = useState<string | null>(null);
  const challenging = game.phase === 'pending' && challengedId === game.current?.id;
  const setChallenging = (on: boolean) => setChallengedId(on ? (game.current?.id ?? null) : null);
  const half = (team: TeamIndex, flipped?: boolean) => (
    <TeamHalf
      team={team}
      game={game}
      dispatch={dispatch}
      onNext={onNext}
      challenging={challenging}
      setChallenging={setChallenging}
      flipped={flipped}
    />
  );
  return (
    <main className="game table">
      {half(1, true)}
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
      {half(0)}
    </main>
  );
}

interface HalfProps {
  team: TeamIndex;
  game: GameState;
  dispatch: Dispatch<GameAction>;
  onNext: () => void;
  /** The other team is picking a gap for its challenge. */
  challenging: boolean;
  setChallenging: (on: boolean) => void;
  flipped?: boolean;
}

function TeamHalf({
  team,
  game,
  dispatch,
  onNext,
  challenging,
  setChallenging,
  flipped,
}: HalfProps) {
  const { phase, teams, activeTeam, result, current, placement } = game;
  const own = teams[team];
  const isActive = activeTeam === team;
  const onTurn =
    (phase === 'placing' ||
      phase === 'pending' ||
      (phase === 'revealed' && result?.type === 'placement')) &&
    isActive;
  const tokens = tokensOf(game, team);
  const showTokens = tokens > 0 || tokensOf(game, other(team)) > 0;
  // the challenging team picks a gap in the active team's timeline, shown on its own half
  const pickForChallenge = challenging && !isActive;

  return (
    <section
      className={`half team-${team} ${flipped ? 'flipped' : ''} ${onTurn ? 'active' : ''}`}
      aria-label={own.name}
    >
      <header className="half-head">
        <h2>{own.name}</h2>
        {onTurn && <span className="badge">Am Zug</span>}
        {showTokens && (
          <span className="tokens" title="Einspruch-Jetons">
            ✋ {tokens}
          </span>
        )}
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
        <p className={`lead ${statusTone(game, team)}`}>{statusText(game, team, challenging)}</p>
        {phase === 'opening' && (
          <button
            type="button"
            className={`btn big team-${team}`}
            onClick={() => dispatch({ type: 'claimOpening', team })}
          >
            {own.name} wusste es
          </button>
        )}
        {phase === 'pending' && isActive && !challenging && (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setChallenging(false);
              dispatch({ type: 'reveal' });
            }}
          >
            Aufdecken
          </button>
        )}
        {phase === 'pending' && !isActive && (
          <button
            type="button"
            className={challenging ? 'btn secondary' : `btn big team-${team}`}
            onClick={() => setChallenging(!challenging)}
          >
            {challenging ? 'Abbrechen' : 'Einspruch!'}
          </button>
        )}
        {phase === 'revealed' && (
          <button type="button" className="btn primary" onClick={onNext}>
            Weiter
          </button>
        )}
      </div>

      {pickForChallenge ? (
        <>
          <h3 className="challenge-head">Zeitleiste von {teams[activeTeam].name}</h3>
          <Timeline
            songs={teams[activeTeam].timeline}
            wrap
            markedGap={placement ?? undefined}
            onPick={(index) => {
              setChallenging(false);
              dispatch({ type: 'challenge', index });
            }}
          />
        </>
      ) : (
        <Timeline
          songs={own.timeline}
          wrap
          highlightId={
            phase === 'revealed' && result && cardOwner(result) === team ? current?.id : undefined
          }
          markedGap={phase === 'pending' && isActive ? (placement ?? undefined) : undefined}
          onPick={
            // the placement is locked while the other team picks its challenge
            (phase === 'placing' || phase === 'pending') && isActive && !challenging
              ? (index) => dispatch({ type: 'place', index })
              : undefined
          }
        />
      )}
    </section>
  );
}

function statusTone(game: GameState, team: TeamIndex): string {
  const { phase, result, winner } = game;
  if (phase === 'revealed' && result?.type === 'placement') {
    const owner = cardOwner(result);
    // a successful challenge is good news only for the challenger
    if (result.challenge && owner !== null) return owner === team ? 'good' : 'bad';
    return owner === null ? 'bad' : 'good';
  }
  if (phase === 'finished' && winner !== 'draw') return winner === team ? 'good' : '';
  return '';
}

/** Status line from the perspective of the team sitting at this half. */
function statusText(game: GameState, team: TeamIndex, challenging: boolean): string {
  const { phase, teams, activeTeam, result, winner } = game;
  const activeName = teams[activeTeam].name;
  switch (phase) {
    case 'opening':
      return 'Wer kennt Titel oder Interpret? Das Team bekommt die erste Karte.';
    case 'placing':
      return activeTeam === team
        ? 'Ihr seid dran: Wann ist das Lied erschienen? Tippt auf die passende Stelle.'
        : `${activeName} ist dran.`;
    case 'pending':
      if (activeTeam === team) {
        return challenging
          ? `${teams[other(team)].name} erhebt Einspruch …`
          : 'Eingeordnet! Ihr könnt die Stelle noch ändern, dann aufdecken.';
      }
      return challenging
        ? `Tippt auf die Stelle bei ${activeName}, an der das Lied eurer Meinung nach liegt.`
        : `${activeName} hat eingeordnet. Liegen sie falsch? Mit einem Einspruch-Jeton könnt ihr die Karte holen.`;
    case 'revealed': {
      if (!result) return '';
      if (result.type === 'opening') {
        if (result.team === null) return 'Keiner wusste es – das Lied wird verworfen.';
        return result.team === team
          ? 'Ihr bekommt die erste Karte!'
          : `${teams[result.team].name} bekommt die erste Karte!`;
      }
      const owner = cardOwner(result);
      if (result.challenge) {
        if (owner === null) return 'Beide falsch – die Karte wird verworfen.';
        if (owner !== result.team) {
          return owner === team
            ? 'Einspruch erfolgreich! Ihr bekommt die Karte.'
            : `Leider falsch – ${teams[owner].name} bekommt die Karte durch Einspruch.`;
        }
        return owner === team
          ? 'Richtig! Einspruch abgewiesen, ihr behaltet die Karte.'
          : `Einspruch abgewiesen – ${teams[owner].name} behält die Karte.`;
      }
      if (owner === null) return 'Leider falsch – die Karte wird verworfen.';
      return owner === team
        ? 'Richtig! Ihr behaltet die Karte.'
        : `Richtig! ${teams[owner].name} behält die Karte.`;
    }
    case 'finished':
      if (winner === 'draw') return 'Unentschieden!';
      if (winner === null) return '';
      return winner === team ? 'Ihr habt gewonnen!' : `${teams[winner].name} gewinnt!`;
  }
}
