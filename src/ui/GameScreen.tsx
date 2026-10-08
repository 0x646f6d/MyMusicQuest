import { useEffect, useState, type Dispatch } from 'react';
import type { AudioProvider } from '../audio/AudioProvider';
import { canClaimBonus, cardOwner, other, tokensOf } from '../game/engine';
import type { GameAction, GameState, TeamIndex } from '../game/types';
import type { Layout } from '../settings';
import { FullscreenButton } from './FullscreenButton';
import { TableLayout } from './TableLayout';
import { Timeline } from './Timeline';
import { useWakeLock } from './useWakeLock';

interface Props {
  game: GameState;
  dispatch: Dispatch<GameAction>;
  provider: AudioProvider;
  layout: Layout;
  onExit: () => void;
}

export function GameScreen({ game, dispatch, provider, layout, onExit }: Props) {
  useWakeLock();
  const { phase, current, teams, activeTeam, result, placement } = game;
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showHost, setShowHost] = useState(false);
  // id of the song the other team is challenging (classic layout), so the mode ends with the round
  const [challengedId, setChallengedId] = useState<string | null>(null);
  const challenging = phase === 'pending' && challengedId === current?.id;
  const hidden = phase === 'opening' || phase === 'placing' || phase === 'pending';
  const turnOf =
    phase === 'placing' ||
    phase === 'pending' ||
    (phase === 'revealed' && result?.type === 'placement')
      ? activeTeam
      : null;
  const showTokens = !!game.challenges || tokensOf(game, 0) > 0 || tokensOf(game, 1) > 0;

  const reportError = (e: Error) => setAudioError(e.message);

  const play = () => {
    if (!current) return;
    provider.play(current).then(() => setAudioError(null), reportError);
  };

  const pause = () => {
    provider.pause().catch(reportError);
  };

  // start the music whenever a new song comes up
  const currentId = current?.id;
  useEffect(() => {
    if (!current || !hidden) return;
    provider.play(current).then(
      () => setAudioError(null),
      (e: Error) => setAudioError(e.message),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  useEffect(() => {
    if (phase === 'finished') provider.pause().catch(() => {});
  }, [phase, provider]);

  const next = () => {
    setShowHost(false);
    dispatch({ type: 'next' });
  };

  const exit = () => {
    if (
      phase === 'finished' ||
      window.confirm('Spiel verlassen? Es kann später fortgesetzt werden.')
    ) {
      pause();
      onExit();
    }
  };

  if (layout === 'table') {
    return (
      <TableLayout
        game={game}
        dispatch={dispatch}
        hidden={hidden}
        onNext={next}
        onExit={onExit}
        controls={
          <>
            <button type="button" className="btn" onClick={play}>
              ▶ Von vorne
            </button>
            <button type="button" className="btn" onClick={pause}>
              ❚❚ Pause
            </button>
            {provider.kind === 'mock' && current && hidden && (
              <button type="button" className="btn link" onClick={() => setShowHost((v) => !v)}>
                {showHost
                  ? `${current.artist} – ${current.title}`
                  : 'Titel für Spielleitung zeigen'}
              </button>
            )}
            <div className="row">
              <FullscreenButton />
              <button type="button" className="btn small" onClick={exit}>
                Menü
              </button>
            </div>
            {audioError && (
              <p className="error" role="alert">
                {audioError}
              </p>
            )}
          </>
        }
      />
    );
  }

  return (
    <main className="game">
      <header className="scoreboard">
        {([0, 1] as TeamIndex[]).map((i) => (
          <div key={i} className={`score team-${i} ${turnOf === i ? 'active' : ''}`}>
            <span className="name">
              {teams[i].name}
              {showTokens && (
                <small className="tokens" title="Einspruch-Jetons">
                  {' '}
                  ✋ {tokensOf(game, i)}
                </small>
              )}
            </span>
            <span className="count">
              {teams[i].timeline.length}
              <small>/{game.target}</small>
            </span>
          </div>
        ))}
        <div className="exit row">
          <FullscreenButton />
          <button type="button" className="btn small" onClick={exit}>
            Menü
          </button>
        </div>
      </header>

      {phase === 'finished' ? (
        <Finished game={game} onExit={onExit} />
      ) : (
        <>
          <section className="stage">
            <div className={`mystery ${hidden ? '' : 'open'}`}>
              {hidden ? (
                <>
                  <span className="q">?</span>
                  <div className="row">
                    <button type="button" className="btn" onClick={play}>
                      ▶ Von vorne
                    </button>
                    <button type="button" className="btn" onClick={pause}>
                      ❚❚ Pause
                    </button>
                  </div>
                  {provider.kind === 'mock' && current && (
                    <button
                      type="button"
                      className="btn link"
                      onClick={() => setShowHost((v) => !v)}
                    >
                      {showHost
                        ? `${current.artist} – ${current.title}`
                        : 'Titel für Spielleitung zeigen'}
                    </button>
                  )}
                </>
              ) : (
                current && (
                  <>
                    <span className="year big">{current.year}</span>
                    <span className="title">{current.title}</span>
                    <span className="artist">{current.artist}</span>
                  </>
                )
              )}
            </div>
            <div className="instructions">
              <Instructions game={game} challenging={challenging} />
              {audioError && (
                <p className="error" role="alert">
                  {audioError}{' '}
                  <button type="button" className="btn small" onClick={play}>
                    Nochmal versuchen
                  </button>
                </p>
              )}
              {phase === 'opening' && (
                <div className="row">
                  {([0, 1] as TeamIndex[]).map((i) => (
                    <button
                      type="button"
                      key={i}
                      className={`btn big team-${i}`}
                      onClick={() => dispatch({ type: 'claimOpening', team: i })}
                    >
                      {teams[i].name} wusste es
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn big secondary"
                    onClick={() => dispatch({ type: 'claimOpening', team: null })}
                  >
                    Keiner
                  </button>
                </div>
              )}
              {phase === 'pending' && (
                <div className="row">
                  {!challenging && (
                    <button
                      type="button"
                      className="btn primary big"
                      onClick={() => dispatch({ type: 'reveal' })}
                    >
                      Aufdecken
                    </button>
                  )}
                  <button
                    type="button"
                    className={
                      challenging ? 'btn big secondary' : `btn big team-${other(activeTeam)}`
                    }
                    onClick={() => setChallengedId(challenging ? null : (current?.id ?? null))}
                  >
                    {challenging ? 'Abbrechen' : `Einspruch! (${teams[other(activeTeam)].name})`}
                  </button>
                </div>
              )}
              {phase === 'revealed' && game.challenges && result?.type === 'placement' && (
                <div className="row">
                  {([0, 1] as TeamIndex[]).map((i) =>
                    canClaimBonus(game, i) ? (
                      <button
                        type="button"
                        key={i}
                        className={`btn team-${i}`}
                        onClick={() => dispatch({ type: 'bonus', team: i })}
                      >
                        {teams[i].name}: Titel & Interpret gewusst +1 ✋
                      </button>
                    ) : (
                      <span key={i} className="bonus">
                        {teams[i].name}: +1 Jeton!
                      </span>
                    ),
                  )}
                </div>
              )}
              {phase === 'revealed' && (
                <button type="button" className="btn primary big" onClick={next}>
                  Weiter
                </button>
              )}
            </div>
          </section>

          <section className="timelines">
            {([activeTeam, activeTeam === 0 ? 1 : 0] as TeamIndex[]).map((i, order) => (
              <div key={i} className={`timeline-row team-${i} ${order === 0 ? 'main' : ''}`}>
                <h3>{teams[i].name}</h3>
                <Timeline
                  songs={teams[i].timeline}
                  compact={order !== 0}
                  highlightId={
                    phase === 'revealed' && result && cardOwner(result) === i
                      ? current?.id
                      : undefined
                  }
                  markedGap={
                    phase === 'pending' && order === 0 ? (placement ?? undefined) : undefined
                  }
                  onPick={
                    (phase === 'placing' || phase === 'pending') && order === 0
                      ? (index) => {
                          if (!challenging) return dispatch({ type: 'place', index });
                          setChallengedId(null);
                          dispatch({ type: 'challenge', index });
                        }
                      : undefined
                  }
                />
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function Instructions({ game, challenging }: { game: GameState; challenging: boolean }) {
  const { phase, teams, activeTeam, result, current } = game;
  if (phase === 'opening') {
    return (
      <p className="lead">Wer kennt Titel oder Interpret? Das Team bekommt die erste Karte.</p>
    );
  }
  if (phase === 'placing') {
    return (
      <p className="lead">
        <strong>{teams[activeTeam].name}</strong> ist dran: Wann ist das Lied erschienen? Tippt auf
        die passende Stelle in eurer Zeitleiste.
      </p>
    );
  }
  if (phase === 'pending') {
    const challenger = teams[other(activeTeam)].name;
    return challenging ? (
      <p className="lead">
        <strong>{challenger}</strong> erhebt Einspruch: Tippt auf die Stelle in der Zeitleiste von{' '}
        {teams[activeTeam].name}, an der das Lied eurer Meinung nach liegt.
      </p>
    ) : (
      <p className="lead">
        <strong>{teams[activeTeam].name}</strong> hat eingeordnet (die Stelle kann noch geändert
        werden). {challenger} kann mit einem Jeton Einspruch erheben.
      </p>
    );
  }
  if (phase === 'revealed' && result) {
    if (result.type === 'opening') {
      return (
        <p className="lead">
          {result.team === null
            ? 'Keiner wusste es – das Lied wird verworfen.'
            : `${teams[result.team].name} bekommt die erste Karte!`}
        </p>
      );
    }
    const owner = cardOwner(result);
    if (owner === null) {
      return (
        <p className="lead bad">
          {result.challenge ? 'Beide falsch' : 'Leider falsch'} – das Lied ist von {current?.year}.
          Die Karte wird verworfen.
        </p>
      );
    }
    if (owner !== result.team) {
      return (
        <p className="lead good">
          Einspruch erfolgreich! Das Lied ist von {current?.year}, {teams[owner].name} bekommt die
          Karte.
        </p>
      );
    }
    return (
      <p className="lead good">
        Richtig!{result.challenge && ' Einspruch abgewiesen.'} {teams[owner].name} behält die Karte.
      </p>
    );
  }
  return null;
}

function Finished({ game, onExit }: { game: GameState; onExit: () => void }) {
  const { winner, teams } = game;
  return (
    <section className="finished">
      <h2>
        {winner === 'draw' ? 'Unentschieden!' : winner !== null && `${teams[winner].name} gewinnt!`}
      </h2>
      <div className="timelines">
        {teams.map((team, i) => (
          <div key={i} className={`timeline-row main team-${i}`}>
            <h3>
              {team.name} – {team.timeline.length} Karten
            </h3>
            <Timeline songs={team.timeline} />
          </div>
        ))}
      </div>
      <button type="button" className="btn primary big" onClick={onExit}>
        Neues Spiel
      </button>
    </section>
  );
}
