/** Telotia site primitives — mark, constellation backdrop. */

function PrincipiaMarkSmall({ size = 18, accent }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <line x1="18" y1="12" x2="18" y2="52"/>
        <line x1="18" y1="12" x2="40" y2="14"/>
        <line x1="40" y1="14" x2="48" y2="22"/>
        <line x1="48" y1="22" x2="44" y2="32"/>
        <line x1="44" y1="32" x2="32" y2="34"/>
        <line x1="32" y1="34" x2="18" y2="32"/>
      </g>
      <g fill="currentColor">
        <circle cx="18" cy="12" r="2.4"/>
        <circle cx="40" cy="14" r="2"/>
        <circle cx="48" cy="22" r="2.4"/>
        <circle cx="44" cy="32" r="1.6"/>
        <circle cx="32" cy="34" r="1.6"/>
        <circle cx="18" cy="32" r="2.2"/>
        <circle cx="18" cy="52" r="2.8" fill={accent || "currentColor"}/>
      </g>
    </svg>
  );
}

function StarField() {
  // A dense star field with three subtle constellations woven through.
  // Coordinates chosen for the 1180-wide × 600-tall hero.
  return (
    <svg viewBox="0 0 1180 700" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
      {/* faint background stars */}
      <g fill="currentColor" opacity="0.5">
        {[
          [40,38],[98,120],[160,60],[230,180],[310,40],[370,220],[440,80],[520,160],[590,50],[650,200],[720,90],[760,250],[820,40],[890,120],[940,210],[1010,60],[1070,180],[1130,90],
          [60,310],[140,400],[240,340],[320,430],[410,370],[490,450],[570,330],[640,400],[710,350],[780,440],[860,360],[930,470],[1000,380],[1080,430],[1140,360],
          [120,250],[220,280],[350,290],[470,260],[600,270],[780,180],[900,260],[1040,280],
          [50,540],[180,580],[290,550],[400,590],[520,540],[640,580],[760,560],[880,600],[1000,540],[1120,580]
        ].map(([x,y], i) => <circle key={i} cx={x} cy={y} r={Math.random() > .7 ? 1.0 : 0.6}/>)}
      </g>

      {/* Constellation 1 — Telos triangle (upper left) */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.55">
        <line x1="160" y1="60" x2="230" y2="180"/>
        <line x1="230" y1="180" x2="120" y2="250"/>
        <line x1="120" y1="250" x2="160" y2="60"/>
      </g>
      <g fill="#DEA193">
        <circle cx="160" cy="60"  r="2.2"/>
        <circle cx="230" cy="180" r="1.8"/>
        <circle cx="120" cy="250" r="1.8"/>
      </g>

      {/* Constellation 2 — Chamber chain (middle) */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.55">
        <line x1="370" y1="220" x2="440" y2="80"/>
        <line x1="440" y1="80" x2="520" y2="160"/>
        <line x1="520" y1="160" x2="590" y2="50"/>
        <line x1="520" y1="160" x2="470" y2="260"/>
      </g>
      <g fill="#DEA193">
        <circle cx="370" cy="220" r="1.8"/>
        <circle cx="440" cy="80"  r="2.2"/>
        <circle cx="520" cy="160" r="1.8"/>
        <circle cx="590" cy="50"  r="2.2"/>
        <circle cx="470" cy="260" r="1.6"/>
      </g>

      {/* Constellation 3 — Synthesis bloom (right) */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.55">
        <line x1="940" y1="210" x2="1010" y2="60"/>
        <line x1="1010" y1="60" x2="1070" y2="180"/>
        <line x1="1070" y1="180" x2="940" y2="210"/>
        <line x1="1010" y1="60" x2="1130" y2="90"/>
      </g>
      <g fill="#DEA193">
        <circle cx="940"  cy="210" r="1.6"/>
        <circle cx="1010" cy="60"  r="2.2"/>
        <circle cx="1070" cy="180" r="1.8"/>
        <circle cx="1130" cy="90"  r="1.6"/>
      </g>
    </svg>
  );
}

Object.assign(window, { PrincipiaMarkSmall, StarField });
