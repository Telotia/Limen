function Install() {
  return (
    <section className="tel-section tel-install" id="install" data-screen-label="04 Install">
      <div className="tel-container">
        <div className="tel-label" style={{marginBottom: 12}}>Install</div>
        <h2>Internal team. <em>For now.</em></h2>
        <p className="lede tel-narrow">
          Principia is not yet generally available. Inside Telotia, it is orchestrated by
          Vivarium, which pins kernel versions per experiment and streams the runtime event
          log to a UI.
        </p>

        <div className="block">
          <div><span className="prompt">$</span><span className="cmd">cargo install --locked </span><span className="arg">\</span></div>
          <div><span className="prompt">&nbsp;</span><span className="cmd">  --git https://github.com/Telotia/Principia </span><span className="arg">\</span></div>
          <div><span className="prompt">&nbsp;</span><span className="cmd">  --tag v0.1.0 </span><span className="arg">\</span></div>
          <div><span className="prompt">&nbsp;</span><span className="cmd">  --root ~/.telotia/vivarium/bin/v0.1.0</span></div>
          <div style={{height: 12}}/>
          <div><span className="cmt"># scaffold .principia/ in a project</span></div>
          <div><span className="prompt">$</span><span className="cmd">principia init </span><span className="arg">&lt;project-dir&gt;</span></div>
          <div style={{height: 12}}/>
          <div><span className="cmt"># the main organism loop</span></div>
          <div><span className="prompt">$</span><span className="cmd">principia run </span><span className="arg">--loop</span></div>
        </div>

        <div className="meta">
          <div className="cell" style={{paddingLeft: 0}}>
            <div className="lbl">Required toolchain</div>
            <div className="val"><span className="mono">stable rust · libsqlite3 · openssl</span></div>
          </div>
          <div className="cell">
            <div className="lbl">Platform</div>
            <div className="val">Linux (production) · macOS · Windows (dev)</div>
          </div>
          <div className="cell">
            <div className="lbl">License</div>
            <div className="val">Proprietary · Telotia</div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Install });
