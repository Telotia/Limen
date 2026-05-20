/** The Telos banner — the active anchor for the organism. */

function TelosBanner({ telos, session, onOpen }) {
  return (
    <div className="viv-telos">
      <div className="label-row">
        <span className="label">Telos Context</span>
        <span className="id">{telos.id}</span>
        <span className="label" style={{color:"var(--proven)"}}>· crystallized · {telos.sufficiency.replace(/_/g, " ")}</span>
      </div>
      <div className="actions">
        <button className="viv-btn viv-btn--secondary" onClick={onOpen}>Read full context</button>
      </div>
      <div className="seed">{telos.seed}</div>
      <div className="meta-row" style={{gridColumn:"1 / -1"}}>
        <span>session <b>{session.id}</b></span>
        <span>·</span>
        <span>origin_kind <b>{session.origin_kind}</b></span>
        <span>·</span>
        <span><b>{telos.oscillations}</b> oscillations to crystallize</span>
        <span>·</span>
        <span>started <b>{session.started}</b></span>
      </div>
    </div>
  );
}

Object.assign(window, { TelosBanner });
