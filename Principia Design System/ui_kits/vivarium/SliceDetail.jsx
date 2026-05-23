/** Slice detail — slide-over panel. */

function SliceDetail({ slice, onClose }) {
  if (!slice) return null;
  return (
    <div className="viv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="viv-detail">
        <div className="viv-detail-head">
          <Pill kind={VERDICT_PILL[slice.verdict]}>{VERDICT_LABEL[slice.verdict]}</Pill>
          <div className="title" style={{flex: 1}}>{slice.id}</div>
          <button className="viv-btn viv-btn--quiet" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
            Close
          </button>
        </div>
        <div className="viv-detail-body">
          <h3>Slice summary</h3>
          <div className="quote">{slice.title}</div>

          <h3>Theory</h3>
          <p>{slice.theory}</p>

          <h3>Evidence</h3>
          <p>{slice.evidence}</p>

          <h3>State</h3>
          <dl className="kv">
            <dt>chamber</dt><dd>{slice.chamber}</dd>
            <dt>re-entries</dt><dd>{slice.reentries}</dd>
            <dt>last engaged</dt><dd>{slice.last}</dd>
            <dt>note</dt><dd style={{fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"13px"}}>{slice.note}</dd>
          </dl>

          <h3 style={{marginTop: 22}}>Actions</h3>
          <div style={{display:"flex", gap: 8, flexWrap:"wrap"}}>
            <button className="viv-btn viv-btn--star">⊛ Re-enter</button>
            <button className="viv-btn viv-btn--secondary">Inspect oscillation history</button>
            <button className="viv-btn viv-btn--quiet">Copy id</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SliceDetail });
