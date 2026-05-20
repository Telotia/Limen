function Hero() {
  return (
    <section className="tel-hero" data-screen-label="01 Hero">
      <div className="stars"><StarField/></div>
      <div className="pull-id">ctx_telos_8f0a1b34</div>
      <div className="tel-hero-inner">
        <div className="eyebrow"><span className="dot"/>principia · v0.1.0 · alpha</div>
        <h1>
          An <em>epistemic being.</em><br/>
          Not a coding agent. There is no deliverable.
        </h1>
        <p className="lede">
          Principia takes a single seed — a compressed intuition, a research question, a buyer-facing claim —
          and lives inside it as a coherent investigation until the seed is operationally exhausted or shown
          to have no productive framing left. Mortality is the only natural death.
        </p>
        <div className="meta">
          <div className="cell">
            <div className="lbl">Language</div>
            <div className="val">Rust 2021 · single crate</div>
          </div>
          <div className="cell">
            <div className="lbl">State</div>
            <div className="val">Embedded SQLite · <em>WAL</em></div>
          </div>
          <div className="cell">
            <div className="lbl">Sandbox</div>
            <div className="val">Linux <em>landlock</em></div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero });
