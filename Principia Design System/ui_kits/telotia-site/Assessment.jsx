function Assessment() {
  return (
    <section className="tel-section tel-assess" id="assessment" data-screen-label="05 Assessment">
      <div className="tel-container">
        <div className="tel-label" style={{marginBottom: 12}}>Honest assessment · v0.1.0</div>
        <h2>The dish runs. The frontier moves.<br/><em>Some things it does not yet demonstrate.</em></h2>
        <p className="lede">
          Every Principia release closes with this section. We ship the limitations alongside
          the wins.
        </p>

        <div className="col-2">
          <div className="card">
            <h3>What v0.1.0 demonstrates</h3>
            <ul>
              <li><span className="mark">✓</span><span>Eight chambers on the v4 ontology, every chamber except Slice oscillating <b>Constructor → Critic → Stabilizer</b>.</span></li>
              <li><span className="mark">✓</span><span>LLM Critic and Stabilizer wired into the Telos chamber — no more hardcoded TTY Critic.</span></li>
              <li><span className="mark">✓</span><span>Worker-Constructor in Inspection, probing the environment under a <b>read-only landlock</b>.</span></li>
              <li><span className="mark">✓</span><span>Symbiosis gated on an <b>AssistantOrganism</b> Context — no empty-Symbiosis firings.</span></li>
              <li><span className="mark">✓</span><span>Mortality is single-source: <b>only the Synthesis Stabilizer emits TELOS_CLOSED</b>.</span></li>
            </ul>
          </div>

          <div className="card weak">
            <h3>What it does not</h3>
            <ul>
              <li><span className="mark">✕</span><span>Any <b>Proven</b> slice in any organism we have run to date.</span></li>
              <li><span className="mark">✕</span><span>A robust separation between <b>meta-debate-about-Principia</b> and engagement-with-the-Telos.</span></li>
              <li><span className="mark">✕</span><span><b>Recovery from a stalled Synthesis</b>; the guard catches them but the scheduler keeps re-firing.</span></li>
              <li><span className="mark">✕</span><span>Worker token I/O ratio is heavy — no canonical prompt prefix for <b>KV-cache reuse</b> yet.</span></li>
              <li><span className="mark">✕</span><span>Falsified-vs-Partial criteria still <b>over-commit to Falsified</b> in observed petri-dish runs.</span></li>
            </ul>
          </div>
        </div>

        <p style={{marginTop: 36, fontFamily:"var(--font-display)", fontStyle:"italic", fontSize: 18, color:"var(--ink-2)", maxWidth: 720}}>
          The next release should target progress-aware heartbeat and tighter Stabilizer verdict criteria.
        </p>
      </div>
    </section>
  );
}

Object.assign(window, { Assessment });
