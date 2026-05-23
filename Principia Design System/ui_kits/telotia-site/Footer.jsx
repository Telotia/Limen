function Footer() {
  return (
    <footer className="tel-footer" data-screen-label="06 Footer">
      <div className="tel-footer-inner">
        <div className="tel-label" style={{color:"var(--night-ink-2)", marginBottom: 24}}>The Telotia dev-flow chain</div>

        <div className="chain">
          <div className="step">
            <span className="lbl">Step 1 · Unit</span>
            <span className="name">Assay</span>
            <span className="desc">The prompt-sweep harness. Every chamber prompt is exercised here before it ever touches the kernel.</span>
            <span className="gh">github.com/Telotia/Assay ↗</span>
          </div>
          <div className="step">
            <span className="lbl">Step 2 · Integration</span>
            <span className="name">Vivarium</span>
            <span className="desc">The control plane. Pins kernel versions per experiment, spawns kernel processes, streams the runtime event log to a UI.</span>
            <span className="gh">github.com/Telotia/Vivarium ↗</span>
          </div>
          <div className="step">
            <span className="lbl">Step 3 · Production</span>
            <span className="name">Principia</span>
            <span className="desc">This kernel. The epistemic-being runtime. Tag-driven releases verified by both Assay and Vivarium before they ship.</span>
            <span className="gh">github.com/Telotia/Principia ↗</span>
          </div>
        </div>

        <div className="bottom">
          <PrincipiaMarkSmall size={16} accent="#DEA193"/>
          <span className="copy">Proprietary · © Telotia · Mortality is the only natural death.</span>
          <span className="spacer"/>
          <a href="#">Security</a>
          <a href="#">Changelog</a>
          <a href="#">Releasing</a>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Footer });
