function Organism() {
  // Reuse the chamber-graph idea but slightly different layout for a marketing read.
  const N = {
    origin:     { x:  60, y: 110, label: "Origin" },
    inspection: { x: 170, y:  60, label: "Inspection" },
    telos:      { x: 170, y: 160, label: "Telos" },
    synthesis:  { x: 340, y: 110, label: "Synthesis", active: true },
    debate:     { x: 510, y:  60, label: "Debate" },
    experiment: { x: 510, y: 160, label: "Experiment" },
    slice:      { x: 660, y: 110, label: "Slice" },
    death:      { x: 820, y: 110, label: "Mortality", terminal: true },
  };
  const EDGES = [
    ["origin", "telos"], ["origin", "inspection"],
    ["inspection", "synthesis"], ["telos", "synthesis"],
    ["synthesis", "debate"], ["debate", "experiment"],
    ["experiment", "slice"],
    ["slice", "synthesis", { dashed: true, label: "re-entry" }],
    ["synthesis", "death", { terminal: true }],
  ];

  return (
    <section className="tel-section tel-organism" id="organism" data-screen-label="02 Organism">
      <div className="tel-container">
        <div className="tel-label" style={{marginBottom: 12}}>The Organism</div>
        <h2>One seed. Eight chambers. <em>One death.</em></h2>
        <p className="lede">
          Every Chamber except Slice oscillates the same way: a Constructor proposes,
          a Critic presses, a convergence check decides whether to iterate, and a
          Stabilizer crystallizes what the engagement honestly earned.
        </p>

        <div className="graph">
          <div className="head">
            <div className="title">Chamber graph · canonical ontology v4</div>
            <div className="legend">
              <span><span className="swatch" style={{background:"#DEA193"}}/>active</span>
              <span><span className="swatch" style={{background:"#3A4664"}}/>completed</span>
              <span><span className="swatch" style={{background:"transparent", border:"1px dashed var(--night-ink-2)"}}/>re-entry</span>
            </div>
          </div>
          <svg viewBox="0 0 900 240" preserveAspectRatio="xMidYMid meet" width="100%" height="240">
            {EDGES.map(([a, b, opts = {}], i) => {
              const A = N[a], B = N[b];
              const dashed = opts.dashed || opts.terminal;
              const activeEdge = !dashed && (N[a].active || N[b].active);
              return (
                <g key={i}>
                  <line
                    x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                    stroke={activeEdge ? "#DEA193" : "#3A4664"}
                    strokeWidth={activeEdge ? 1.5 : 0.9}
                    strokeDasharray={dashed ? "3 5" : ""}
                    opacity={dashed ? 0.55 : 1}
                  />
                  {opts.label && (
                    <text x={(A.x + B.x) / 2 - 14} y={(A.y + B.y) / 2 - 8} fontFamily="Newsreader" fontStyle="italic" fontSize="12" fill="#B0A89A">{opts.label}</text>
                  )}
                </g>
              );
            })}
            {Object.entries(N).map(([id, n]) => (
              <g key={id}>
                <circle cx={n.x} cy={n.y} r={n.active ? 14 : 10}
                  fill={n.active ? "#DEA193" : (n.terminal ? "var(--night)" : "#162244")}
                  stroke={n.active ? "#DEA193" : "#B0A89A"}
                  strokeWidth="0.9"
                  strokeDasharray={n.terminal ? "2 3" : ""}/>
                {n.terminal && (
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fill="#B0A89A">✕</text>
                )}
                <text
                  x={n.x}
                  y={n.y < 110 ? n.y - 22 : n.y + 28}
                  textAnchor="middle"
                  fontFamily="IBM Plex Sans" fontSize="11" letterSpacing=".14em"
                  style={{textTransform:"uppercase"}}
                  fill={n.active ? "#DEA193" : "#B0A89A"}
                >{n.label}</text>
              </g>
            ))}
          </svg>
        </div>

        <dl className="cycle">
          <dt><small>Step 1</small>Telos</dt>
          <dd>The Origin proposes a seed. The Critic presses it against the observed environment. The Stabilizer crystallizes the seed into a <em>Telos Context</em> — or rejects it. The session opens.</dd>

          <dt><small>Step 2 → 6</small>Slice cycle</dt>
          <dd>Synthesis releases a Slice. Debate stabilizes a Theory in its favour. Experiment engages the Theory in the workspace sandbox. Slice judges <em>Proven</em>, <em>Falsified</em>, or <em>Partial</em>. Partial re-enters Debate.</dd>

          <dt><small>Step 7</small>Mortality</dt>
          <dd>When the completed Slices together exhaust the Telos's productive framings, the Synthesis Stabilizer — and only the Synthesis Stabilizer — emits <em>TELOS_CLOSED</em>. The organism dies. Refuting one reading of the Telos does not exhaust it.</dd>
        </dl>
      </div>
    </section>
  );
}

Object.assign(window, { Organism });
