// Mocked organism state for the Vivarium kit.
// Resembles the kernel's runtime_events + slices + telos_sessions shape.

window.VIVARIUM_DATA = {
  session: {
    id: "ts_2026_05_17_a3f",
    started: "2026-05-17 10:38:02",
    status: "active",
    origin_kind: "human_tty",
  },
  telos: {
    id: "ctx_telos_8f0a1b34",
    seed:
      "Most randomness has hidden structure — the question is whether the structure is operationally legible.",
    sufficiency: "pressure_addressed",
    oscillations: 3,
    critic_pressure:
      "The claim quietly assumes a particular reading of \"operational legibility\" — without an apparatus criterion it cannot fail.",
  },

  chambers: [
    { id: "telos",       active: false, glyph: "telos" },
    { id: "inspection",  active: false, glyph: "inspection" },
    { id: "synthesis",   active: true,  glyph: "synthesis" },
    { id: "debate",      active: false, glyph: "debate" },
    { id: "experiment",  active: false, glyph: "experiment" },
    { id: "slice",       active: false, glyph: "slice" },
    { id: "sym-out",     active: false, glyph: "sym-out" },
    { id: "sym-in",      active: false, glyph: "sym-in" },
  ],

  slices: [
    {
      id: "ctx_slice_a3f2b9c1",
      title:
        "A short intuition admits multiple operational readings — exhaustion is not the same as refutation.",
      verdict: "partial",
      reentries: 3,
      last: "4 min ago",
      note: "worker apparatus failed — max_tokens",
      chamber: "Slice ▸ Experiment re-entry",
      theory:
        "If \"hidden structure\" is given an apparatus criterion (e.g. compressibility under a fixed encoder), the claim is falsifiable per encoder, but unfalsifiable in general — making the bare claim closer to a research disposition than a Theory.",
      evidence:
        "The Worker began to instantiate a compressibility probe on three sample streams but exited at max_tokens before any apparatus output landed. No fabricated numbers were promoted to evidence.",
    },
    {
      id: "ctx_slice_4d12e0",
      title:
        "Compressibility under a fixed encoder is a defensible apparatus criterion for legible structure.",
      verdict: "proven",
      reentries: 1,
      last: "12 min ago",
      note: "settled under Critic pressure; encoder choice is explicit",
      chamber: "Debate ▸ Experiment ▸ Slice",
      theory:
        "Under a declared encoder E and threshold τ, \"the stream is legibly structured\" can be operationalised as \"E compresses the stream below τ relative to a Kolmogorov-style upper bound\". This survives the Critic's challenge that legibility is observer-relative because the observer (E) is named.",
      evidence:
        "The Experiment Constructor ran zlib-9 over three reference streams (two synthetic, one random.org) and recorded the ratios verbatim. The Critic pressed on encoder choice; the Theory absorbed the pressure by making E explicit.",
    },
    {
      id: "ctx_slice_71e2aa",
      title:
        "Legibility-of-structure cannot be reduced to predictability without abandoning the original seed.",
      verdict: "falsified",
      reentries: 2,
      last: "31 min ago",
      note: "reduction collapses the Telos into a strictly weaker claim",
      chamber: "Synthesis ▸ Debate ▸ Slice",
      theory:
        "If we equate \"legible structure\" with \"predictable next symbol\", a fair coin becomes legibly structured at long horizons, which violates the Origin's anchor.",
      evidence:
        "The Critic produced a counter-example (the fair-coin frequency argument) that the Constructor could not dismiss without retreating to a different reading of the Telos.",
    },
    {
      id: "ctx_slice_9c0017",
      title:
        "A Telos of this shape may admit no operational closure across any Slice cycle — the seed is itself the experiment.",
      verdict: "open",
      reentries: 0,
      last: "just now",
      note: "Synthesis released; awaiting Debate",
      chamber: "Synthesis released",
      theory: "(awaiting Debate Constructor)",
      evidence: "(no Experiment yet)",
    },
  ],

  events: [
    { ts: "10:42:01.412", lvl: ".", chamber: "telos",      kind: "verdict",      msg: ["crystallize · ", { id: "ctx_telos_8f0a1b" }, " · sufficiency=", { em: "pressure_addressed" }] },
    { ts: "10:42:03.001", lvl: ".", chamber: "synthesis",  kind: "osc",          msg: ["oscillation_turn · osc=", { em: "1" }, " · role=constructor"] },
    { ts: "10:42:14.339", lvl: ".", chamber: "synthesis",  kind: "osc",          msg: ["oscillation_check · verdict=", { em: "ITERATE" }] },
    { ts: "10:42:16.882", lvl: ".", chamber: "synthesis",  kind: "osc",          msg: ["oscillation_turn · osc=", { em: "2" }, " · role=critic"] },
    { ts: "10:42:31.770", lvl: ".", chamber: "slice",      kind: "verdict",      msg: ["developed · ", { id: "slice_a3f2b9" }, " · verdict=", { em: "Partial" }] },
    { ts: "10:42:42.118", lvl: ".", chamber: "debate",     kind: "osc",          msg: ["oscillation_turn · osc=", { em: "1" }, " · role=constructor"] },
    { ts: "10:42:55.218", lvl: "!", chamber: "experiment", kind: "err",          msg: ["apparatus ", { err: "max_tokens" }, " · tool_calls=7"] },
    { ts: "10:43:02.004", lvl: ".", chamber: "organism",   kind: "heartbeat",    msg: ["heartbeat · uptime=", { em: "14m22s" }] },
    { ts: "10:43:12.554", lvl: ".", chamber: "slice",      kind: "verdict",      msg: ["developed · ", { id: "slice_4d12e0" }, " · verdict=", { em: "Proven" }] },
    { ts: "10:43:28.991", lvl: ".", chamber: "synthesis",  kind: "osc",          msg: ["oscillation_turn · osc=", { em: "3" }, " · role=stabilizer"] },
    { ts: "10:43:40.207", lvl: ".", chamber: "synthesis",  kind: "verdict",      msg: ["released · ", { id: "ctx_slice_9c0017" }, " · status=", { em: "Partial" }] },
    { ts: "10:43:55.043", lvl: ".", chamber: "organism",   kind: "heartbeat",    msg: ["heartbeat · uptime=", { em: "15m14s" }] },
  ],
};
