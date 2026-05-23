/** Slice list — the system's hero unit of meaning. */

const VERDICT_PILL = {
  proven:    "proven",
  falsified: "falsified",
  partial:   "partial",
  open:      "open",
  closed:    "closed",
};
const VERDICT_LABEL = {
  proven:    "Proven",
  falsified: "Falsified",
  partial:   "Partial",
  open:      "Open",
  closed:    "Closed",
};
const LEFT_RULE = {
  proven:    "#2E5D3A",
  falsified: "#8C2B2B",
  partial:   "#B57B19",
  open:      "#2C4E7A",
  closed:    "#4A3A56",
};

function SliceList({ slices, selectedId, onSelect }) {
  return (
    <div className="viv-slice-list">
      {slices.map(s => (
        <div
          key={s.id}
          className={`viv-slice viv-slice--${s.verdict}`}
          aria-selected={selectedId === s.id ? "true" : "false"}
          onClick={() => onSelect(s.id)}
        >
          <div className="left-rule" style={{background: LEFT_RULE[s.verdict]}}/>
          <div>
            <div className="title">{s.title}</div>
            <div className="meta">
              <span>{s.chamber}</span>
              <span>·</span>
              <span><b>{s.reentries}</b> re-entries</span>
              <span>·</span>
              <span>last engaged <b>{s.last}</b></span>
              <span>·</span>
              <span style={{fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--text-2)"}}>{s.note}</span>
            </div>
          </div>
          <div className="right">
            <Pill kind={VERDICT_PILL[s.verdict]}>{VERDICT_LABEL[s.verdict]}</Pill>
            <span className="id">{s.id}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { SliceList, VERDICT_PILL, VERDICT_LABEL });
