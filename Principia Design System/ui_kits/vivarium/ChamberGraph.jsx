/** The chamber graph — constellation rendering of the kernel's chamber chain. */

function ChamberGraph({ active, completed }) {
  // Positions chosen to read as a constellation, not a flowchart grid.
  const N = {
    origin:     { x:  60, y: 132, label: "Origin",     glyph: null,         optional: true },
    inspection: { x: 130, y:  68, label: "Inspection", glyph: "inspection" },
    telos:      { x: 130, y: 196, label: "Telos",      glyph: "telos" },
    synthesis:  { x: 290, y: 132, label: "Synthesis",  glyph: "synthesis"  },
    debate:     { x: 430, y:  68, label: "Debate",     glyph: "debate" },
    experiment: { x: 430, y: 196, label: "Experiment", glyph: "experiment" },
    slice:      { x: 560, y: 132, label: "Slice",      glyph: "slice" },
    death:      { x: 700, y: 132, label: "Mortality",  glyph: null, terminal: true },
  };
  const EDGES = [
    ["origin",     "telos"],
    ["origin",     "inspection"],
    ["inspection", "synthesis"],
    ["telos",      "synthesis"],
    ["synthesis",  "debate"],
    ["debate",     "experiment"],
    ["experiment", "slice"],
    ["slice",      "synthesis", { dashed: true, label: "re-entry" }],
    ["synthesis",  "death",     { terminal: true }],
  ];

  return (
    <div className="viv-graph">
      <div className="sub" style={{color: "var(--night-ink-2)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 4}}>
        Active chamber pulses rose · completed chambers carry their last verdict
      </div>
      <svg viewBox="0 0 760 260" preserveAspectRatio="xMidYMid meet">
        {/* edges */}
        {EDGES.map(([a, b, opts = {}], i) => {
          const A = N[a], B = N[b];
          const dashed = opts.dashed || opts.terminal;
          const activeEdge =
            !dashed && (a === active || b === active);
          return (
            <g key={i}>
              <line
                x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                stroke={activeEdge ? "var(--star)" : "#3A4664"}
                strokeWidth={activeEdge ? 1.4 : 0.8}
                strokeDasharray={dashed ? "2 4" : ""}
                opacity={dashed ? 0.6 : 0.95}
              />
              {opts.label && (
                <text
                  x={(A.x + B.x) / 2}
                  y={(A.y + B.y) / 2 - 6}
                  textAnchor="middle"
                  fontFamily="Newsreader, serif"
                  fontStyle="italic"
                  fontSize="11"
                  fill="var(--night-ink-2)"
                >{opts.label}</text>
              )}
            </g>
          );
        })}

        {/* nodes */}
        {Object.entries(N).map(([id, n]) => {
          const isActive = id === active;
          const isCompleted = completed.includes(id);
          const isTerminal  = n.terminal;
          return (
            <g key={id}>
              <circle
                cx={n.x} cy={n.y}
                r={isActive ? 14 : 10}
                fill={isActive ? "var(--star)" : (isCompleted ? "#3A4664" : "var(--night-2)")}
                stroke={isActive ? "var(--star)" : (isCompleted ? "var(--night-ink-2)" : "var(--night-ink-2)")}
                strokeWidth="0.8"
                strokeDasharray={isTerminal ? "2 2" : ""}
                opacity={n.optional && !isActive ? 0.75 : 1}
              />
              {n.glyph && (
                <g transform={`translate(${n.x - 8}, ${n.y - 8})`} style={{color: isActive ? "var(--ink)" : "var(--night-ink-2)"}}>
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    {(() => {
                      // Re-emit glyph paths inline; ChamberGlyph as SVG can't be embedded as <svg> in <svg>.
                      const G = {
                        telos:      <g><circle cx="12" cy="9" r="2.4" fill="currentColor"/><line x1="12" y1="11.4" x2="12" y2="20" stroke="currentColor" strokeLinecap="round"/><line x1="6" y1="20" x2="18" y2="20" stroke="currentColor" strokeLinecap="round"/></g>,
                        inspection: <g fill="none" stroke="currentColor" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M5 12 Q12 7 19 12 Q12 17 5 12 Z"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></g>,
                        synthesis:  <g fill="none" stroke="currentColor" strokeLinecap="round"><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="5" cy="6" r="1.4" fill="currentColor"/><circle cx="19" cy="6" r="1.4" fill="currentColor"/><circle cx="12" cy="20" r="1.4" fill="currentColor"/><line x1="12" y1="12" x2="5" y2="6"/><line x1="12" y1="12" x2="19" y2="6"/><line x1="12" y1="12" x2="12" y2="20"/></g>,
                        debate:     <g fill="none" stroke="currentColor" strokeLinecap="round"><circle cx="5" cy="12" r="2.2" fill="currentColor"/><circle cx="19" cy="12" r="2.2" fill="currentColor"/><line x1="7" y1="10" x2="17" y2="14"/><line x1="7" y1="14" x2="17" y2="10"/></g>,
                        experiment: <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 v6 L5 18 a2 2 0 0 0 2 3 h10 a2 2 0 0 0 2 -3 L14 9 V3"/><line x1="9" y1="3" x2="15" y2="3"/><circle cx="12" cy="16" r="0.8" fill="currentColor"/></g>,
                        slice:      <g fill="none" stroke="currentColor" strokeLinecap="round"><rect x="4" y="6" width="16" height="12" rx="1"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="20" cy="12" r="1.6" fill="currentColor"/></g>,
                      };
                      return G[n.glyph];
                    })()}
                  </svg>
                </g>
              )}
              {isTerminal && (
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10" fill="var(--night-ink-2)">✕</text>
              )}
              <text
                x={n.x}
                y={n.y < 130 ? n.y - 22 : n.y + 28}
                textAnchor="middle"
                fontFamily="IBM Plex Sans, sans-serif"
                fontSize="10"
                letterSpacing=".14em"
                style={{textTransform: "uppercase"}}
                fill={isActive ? "var(--star)" : "var(--night-ink-2)"}
              >{n.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

Object.assign(window, { ChamberGraph });
