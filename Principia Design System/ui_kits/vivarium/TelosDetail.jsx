/** Telos detail panel — slide-over with seed, critic pressure, session info. */

function TelosDetail({ telos, session, onClose }) {
  if (!telos) return null;
  return (
    <div className="viv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="viv-detail">
        <div className="viv-detail-head">
          <Pill kind="open">Active</Pill>
          <div className="title" style={{flex: 1}}>{telos.id}</div>
          <button className="viv-btn viv-btn--quiet" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
            Close
          </button>
        </div>
        <div className="viv-detail-body">
          <h3>Telos seed</h3>
          <div className="quote">{telos.seed}</div>

          <h3>Critic pressure (most recent)</h3>
          <p style={{fontFamily:"var(--font-display)", fontStyle:"italic", color:"var(--ink-2)"}}>“{telos.critic_pressure}”</p>

          <h3>Crystallization</h3>
          <dl className="kv">
            <dt>sufficiency</dt><dd>{telos.sufficiency}</dd>
            <dt>oscillations</dt><dd>{telos.oscillations}</dd>
            <dt>origin_kind</dt><dd>{session.origin_kind}</dd>
            <dt>started</dt><dd>{session.started}</dd>
            <dt>status</dt><dd>{session.status}</dd>
          </dl>

          <h3 style={{marginTop:22}}>Actions</h3>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <button className="viv-btn viv-btn--secondary">Open ontology</button>
            <button className="viv-btn viv-btn--quiet">Copy id</button>
            <button className="viv-btn viv-btn--secondary" style={{color:"var(--falsified)", borderColor:"var(--falsified)"}}>Terminate session</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TelosDetail });
