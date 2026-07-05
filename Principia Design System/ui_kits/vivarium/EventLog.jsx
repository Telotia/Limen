/** Event log — night surface, streaming. */

const CHAMBER_DOT = {
  telos:      "#DEA193",
  inspection: "#7AB89C",
  synthesis:  "#A7B3CC",
  debate:     "#A7B3CC",
  experiment: "#E89A6A",
  slice:      "#7AB89C",
  organism:   "#8C9AB2",
  "sym-out":  "#B07A6A",
  "sym-in":   "#B07A6A",
};

function renderMsg(parts) {
  return parts.map((p, i) => {
    if (typeof p === "string") return <React.Fragment key={i}>{p}</React.Fragment>;
    if (p.em)   return <span key={i} className="em">{p.em}</span>;
    if (p.err)  return <span key={i} className="err">{p.err}</span>;
    if (p.id)   return <span key={i} className="id">{p.id}</span>;
    if (p.punct) return <span key={i} className="punct">{p.punct}</span>;
    return null;
  });
}

function EventLog({ events, session }) {
  return (
    <div className="viv-log">
      <div className="viv-log-head">
        <PrincipiaMark size={16} accent="#DEA193"/>
        <div className="title">runtime event log</div>
        <div className="sub">{session.id}</div>
      </div>
      <div className="viv-log-body">
        {events.map((e, i) => (
          <div className="viv-log-row" key={i}>
            <div className="ts">{e.ts}</div>
            <div className="lvl" style={{color: e.lvl === "!" ? "#E89A6A" : "var(--star)"}}>{e.lvl}</div>
            <div className="marker" style={{background: CHAMBER_DOT[e.chamber] || "#8C9AB2"}}/>
            <div className="chamber">{e.chamber}</div>
            <div className="msg">{renderMsg(e.msg)}</div>
          </div>
        ))}
      </div>
      <div className="viv-log-foot">
        <span className="live"><span className="dot"/>live</span>
        <span>· {events.length} events · tail</span>
      </div>
    </div>
  );
}

Object.assign(window, { EventLog });
