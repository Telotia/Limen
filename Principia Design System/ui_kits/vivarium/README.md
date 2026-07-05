# Vivarium UI kit

Operator control plane for Principia. Streams the kernel's runtime event log, shows the chamber graph, lists open and closed Slices, exposes Telos session details.

This kit is an **extrapolation**, not a recreation. The real Vivarium repository was not accessible when this kit was authored. It was built from the kernel's event vocabulary (`runtime_events`, `chamber_runs`, `slices` tables described in `Principia/README.md`) and the ontology document. Re-derive from real Vivarium code (`shared-types/src/kernel-events.ts`) when available.

## Screens (interactive)

- **Kernel monitor** (default) — top bar with active telos session, chamber graph (the eight chambers as a constellation), live event log, open-slice list.
- **Slice detail** — clicking a slice opens a right-side panel with its history, theory, evidence, and verdict.
- **Telos detail** — clicking the session id opens the seed + critic pressure + sufficiency tag.

## Components (JSX)

- `App.jsx` — orchestration
- `TopBar.jsx` — fixed top bar with brand + session
- `LeftRail.jsx` — chamber glyph navigation
- `ChamberGraph.jsx` — constellation-style chamber graph
- `SliceList.jsx` — slice list with verdict pills
- `SliceDetail.jsx` — right panel detail
- `EventLog.jsx` — night-surface streaming log
- `TelosBanner.jsx` — collapsible Telos seed reader
- `data.js` — mocked organism state

## Design rules (Vivarium-specific)

- **Two surfaces in one app.** Paper (everything operator-facing) and Night (the event log only). Never night for primary surfaces; never paper for the log.
- **The chamber graph is the brand mark in motion.** Active chamber is the gold star.
- **No notifications.** A kernel monitor doesn't ping; the operator reads the log.
- **Slice cards carry exactly one verdict pill.** No avatar, no "owner", no quick-actions. The verdict and the title are the entire affordance.
