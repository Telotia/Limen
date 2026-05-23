function Nav() {
  return (
    <div className="tel-nav">
      <div className="tel-nav-inner">
        <a href="#" className="brand" style={{textDecoration: "none", border: 0}}>
          <PrincipiaMarkSmall size={20} accent="#DEA193"/>
          <div className="wm">Principia</div>
          <div className="org">a telotia kernel</div>
        </a>
        <div className="links">
          <a href="#organism">Organism</a>
          <a href="#vocabulary">Vocabulary</a>
          <a href="#install">Install</a>
          <a href="#assessment">Assessment</a>
        </div>
        <div className="spacer"/>
        <a className="gh" href="#">github.com/Telotia/Principia ↗</a>
      </div>
    </div>
  );
}

Object.assign(window, { Nav });
