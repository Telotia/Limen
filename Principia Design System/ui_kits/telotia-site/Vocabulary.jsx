function Vocabulary() {
  const terms = [
    { term: "Telos",       pos: "noun",        def: "The seed crystallized by the Telos Chamber. The organism's anchor. Not a deliverable; an epistemic commitment that the rest of the organism is measured against." },
    { term: "Slice",       pos: "noun",        def: "A defensible, independently investigable position about the Telos. Carries a Status: Proven, Falsified, or Partial." },
    { term: "Crystallize", pos: "verb",        def: "The act of writing an immutable Crystallized Context. Stabilizers crystallize; nothing else does." },
    { term: "Constructor", pos: "role",        def: "Proposes the chamber's output in its own voice. A worker in Inspection and Experiment; a thinker elsewhere." },
    { term: "Critic",      pos: "role",        def: "Presses for load-bearing weaknesses. On the same team as the Constructor — both share one job: land a sound output." },
    { term: "Stabilizer",  pos: "role",        def: "Judges. Not advocating for any verdict. Reads the full oscillation history and commits to what the engagement honestly earned." },
    { term: "Symbiosis",   pos: "noun",        def: "Outbound: commission another organism. Inbound: re-house another organism's closed Telos as a Perception Context." },
    { term: "Mortality",   pos: "terminal",    def: "TELOS_CLOSED. The single declared end-state. Emitted only by the Synthesis Stabilizer, only when productive framings are exhausted. The only natural death." },
    { term: "Apparatus",   pos: "noun",        def: "One form of evidence — not the only one. A worker may run shell tools inside the sandbox; reasoning-only Slices are also valid Evidence." },
  ];
  return (
    <section className="tel-section tel-vocab" id="vocabulary" data-screen-label="03 Vocabulary">
      <div className="tel-container">
        <div className="tel-label" style={{marginBottom: 12}}>Vocabulary</div>
        <h2>Words carry their <em>ontology</em>.</h2>
        <p className="lede">
          Every term below appears in the kernel's prompts and the canonical ontology document.
          Use them precisely. Do not rebrand.
        </p>
        <div className="grid">
          {terms.map(t => (
            <div className="cell" key={t.term}>
              <div className="pos">{t.pos}</div>
              <div className="term">{t.term}</div>
              <div className="def">{t.def}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Vocabulary });
