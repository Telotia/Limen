/** Vivarium top bar and left rail. */

function TopBar({ session, telos, onOpenTelos }) {
  return (
    <div className="viv-top">
      <div className="viv-brand">
        <PrincipiaMark size={22} accent="#DEA193"/>
        <div className="wm">Principia</div>
        <div className="org">vivarium · operator</div>
      </div>

      <div className="viv-session" onClick={onOpenTelos} title="Open Telos detail">
        <span className="dot running"/>
        <div>
          <div className="label">Telos Session</div>
          <div className="id">{session.id} · <span style={{color:"var(--ink-3)"}}>origin_kind={session.origin_kind}</span></div>
        </div>
      </div>

      <div className="spacer"/>

      <button className="viv-icon-btn" title="Search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="11" cy="11" r="6"/><line x1="15.5" y1="15.5" x2="20" y2="20"/>
        </svg>
      </button>
      <button className="viv-icon-btn" title="Pause">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>
        </svg>
      </button>
      <button className="viv-icon-btn" title="Settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 3 v3 M12 18 v3 M3 12 h3 M18 12 h3 M5.5 5.5 l2.1 2.1 M16.4 16.4 l2.1 2.1 M5.5 18.5 l2.1 -2.1 M16.4 7.6 l2.1 -2.1"/>
        </svg>
      </button>
    </div>
  );
}

function LeftRail({ active, onChange }) {
  const items = [
    { id: "synthesis",  glyph: "synthesis",  title: "Synthesis" },
    { id: "telos",      glyph: "telos",      title: "Telos" },
    { id: "inspection", glyph: "inspection", title: "Inspection" },
    { id: "debate",     glyph: "debate",     title: "Debate" },
    { id: "experiment", glyph: "experiment", title: "Experiment" },
    { id: "slice",      glyph: "slice",      title: "Slice" },
    { id: "sym-out",    glyph: "sym-out",    title: "Symbiosis Outbound" },
    { id: "sym-in",     glyph: "sym-in",     title: "Symbiosis Inbound" },
  ];
  return (
    <div className="viv-rail">
      {items.map(it => (
        <button
          key={it.id}
          className="viv-rail-item"
          aria-current={active === it.id ? "true" : "false"}
          onClick={() => onChange(it.id)}
          title={it.title}
        >
          <ChamberGlyph name={it.glyph}/>
        </button>
      ))}
      <div className="spacer"/>
      <button className="viv-rail-item" title="Settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 3 v3 M12 18 v3 M3 12 h3 M18 12 h3 M5.5 5.5 l2.1 2.1 M16.4 16.4 l2.1 2.1 M5.5 18.5 l2.1 -2.1 M16.4 7.6 l2.1 -2.1"/>
        </svg>
      </button>
    </div>
  );
}

Object.assign(window, { TopBar, LeftRail });
