/** Vivarium app orchestrator. */

function App() {
  const D = window.VIVARIUM_DATA;
  const [activeChamber, setActiveChamber] = useState("synthesis");
  const [selectedSlice, setSelectedSlice]   = useState(null);
  const [telosOpen, setTelosOpen]           = useState(false);

  const completedChambers = ["telos", "inspection"];
  const slice = D.slices.find(s => s.id === selectedSlice);

  return (
    <div className="viv-app" data-screen-label="Vivarium · Kernel Monitor">
      <TopBar
        session={D.session}
        telos={D.telos}
        onOpenTelos={() => setTelosOpen(true)}
      />
      <LeftRail active={activeChamber} onChange={setActiveChamber}/>

      <div className="viv-main">
        <div className="viv-section">
          <div className="viv-section-head">
            <h2>Active Telos</h2>
            <span className="meta">crystallized · {D.telos.sufficiency.replace(/_/g, " ")}</span>
          </div>
          <TelosBanner telos={D.telos} session={D.session} onOpen={() => setTelosOpen(true)}/>
        </div>

        <div className="viv-section">
          <div className="viv-section-head">
            <h2>Chamber graph</h2>
            <span className="meta">active · <span style={{color:"var(--ink-2)", fontWeight: 500}}>{activeChamber}</span></span>
          </div>
          <ChamberGraph active={activeChamber} completed={completedChambers}/>
        </div>

        <div className="viv-section">
          <div className="viv-section-head">
            <h2>Slices</h2>
            <span className="meta">{D.slices.length} contexts · 1 open · 1 proven · 1 falsified · 1 partial</span>
          </div>
          <SliceList slices={D.slices} selectedId={selectedSlice} onSelect={setSelectedSlice}/>
        </div>
      </div>

      <EventLog events={D.events} session={D.session}/>

      {selectedSlice && (
        <SliceDetail slice={slice} onClose={() => setSelectedSlice(null)}/>
      )}
      {telosOpen && (
        <TelosDetail telos={D.telos} session={D.session} onClose={() => setTelosOpen(false)}/>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
