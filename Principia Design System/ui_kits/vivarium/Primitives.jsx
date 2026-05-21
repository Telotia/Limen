/** Vivarium components. All globals attached to window for cross-script. */
const { useState, useMemo } = React;

/* ─── Chamber glyph ─ inline ──────────────────────────────────────────── */
function ChamberGlyph({ name, ...p }) {
  const M = {
    telos: (<g>
      <circle cx="12" cy="9" r="2.4" fill="currentColor"/>
      <line x1="12" y1="11.4" x2="12" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <line x1="6" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </g>),
    inspection: (<g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" rx="1"/>
      <path d="M5 12 Q12 7 19 12 Q12 17 5 12 Z"/>
      <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
    </g>),
    synthesis: (<g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
      <circle cx="5" cy="6" r="1.4" fill="currentColor"/>
      <circle cx="19" cy="6" r="1.4" fill="currentColor"/>
      <circle cx="12" cy="20" r="1.4" fill="currentColor"/>
      <line x1="12" y1="12" x2="5" y2="6"/>
      <line x1="12" y1="12" x2="19" y2="6"/>
      <line x1="12" y1="12" x2="12" y2="20"/>
    </g>),
    debate: (<g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <circle cx="5" cy="12" r="2.2" fill="currentColor"/>
      <circle cx="19" cy="12" r="2.2" fill="currentColor"/>
      <line x1="7" y1="10" x2="17" y2="14"/>
      <line x1="7" y1="14" x2="17" y2="10"/>
    </g>),
    experiment: (<g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3 v6 L5 18 a2 2 0 0 0 2 3 h10 a2 2 0 0 0 2 -3 L14 9 V3"/>
      <line x1="9" y1="3" x2="15" y2="3"/>
      <circle cx="12" cy="16" r="0.8" fill="currentColor"/>
      <circle cx="9" cy="18" r="0.6" fill="currentColor"/>
    </g>),
    slice: (<g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <rect x="4" y="6" width="16" height="12" rx="1"/>
      <line x1="4" y1="12" x2="20" y2="12" strokeWidth="1.4"/>
      <circle cx="20" cy="12" r="1.6" fill="currentColor"/>
    </g>),
    "sym-out": (<g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="12" r="3" fill="currentColor" stroke="none"/>
      <line x1="10" y1="12" x2="20" y2="12"/>
      <polyline points="16,8 20,12 16,16"/>
    </g>),
    "sym-in": (<g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="17" cy="12" r="3" fill="currentColor" stroke="none"/>
      <line x1="14" y1="12" x2="4" y2="12"/>
      <polyline points="8,8 4,12 8,16"/>
    </g>),
  };
  return (
    <svg viewBox="0 0 24 24" {...p}>{M[name]}</svg>
  );
}

/* ─── Principia mark ─────────────────────────────────────────────────── */
function PrincipiaMark({ size = 22, accent }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <line x1="18" y1="12" x2="18" y2="52"/>
        <line x1="18" y1="12" x2="40" y2="14"/>
        <line x1="40" y1="14" x2="48" y2="22"/>
        <line x1="48" y1="22" x2="44" y2="32"/>
        <line x1="44" y1="32" x2="32" y2="34"/>
        <line x1="32" y1="34" x2="18" y2="32"/>
      </g>
      <g fill="currentColor">
        <circle cx="18" cy="12" r="2.2"/>
        <circle cx="40" cy="14" r="1.8"/>
        <circle cx="48" cy="22" r="2.2"/>
        <circle cx="44" cy="32" r="1.6"/>
        <circle cx="32" cy="34" r="1.6"/>
        <circle cx="18" cy="32" r="2.2"/>
        <circle cx="18" cy="52" r="2.6" fill={accent || "currentColor"}/>
      </g>
    </svg>
  );
}

/* ─── Pill ───────────────────────────────────────────────────────────── */
function Pill({ kind, children, dot = true }) {
  return (
    <span className={`viv-pill viv-pill--${kind}`}>
      {dot && <span className="dot"/>}
      {children}
    </span>
  );
}

Object.assign(window, { ChamberGlyph, PrincipiaMark, Pill });
