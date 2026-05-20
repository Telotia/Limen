# Principia Design System

A design system for **Telotia / Principia** — an epistemic-being runtime and the surfaces that surround it (the Vivarium control plane, the Telotia marketing site, slides, and operator tooling).

Built from the canonical ontology and the prompt corpus inside the kernel. It encodes what Principia *is* — a philosophical instrument, not a SaaS product — into colors, type, and components.

> An epistemic being. Not a coding agent. There is no deliverable.

---

## Sources

The artifacts here were derived from the following internal repositories. None of this code or document content lives in this design-system project — only its visual implications.

- **GitHub · Telotia/Principia** — `github.com/Telotia/Principia` — the Rust kernel. Mounted locally during construction at `Principia/`.
- **GitHub · Telotia/Vivarium** — `github.com/Telotia/Vivarium` — the control plane that streams the kernel's runtime event log to a UI. Not yet read; the Vivarium UI kit in this project extrapolates from event-stream contracts found in Principia's README and `events.rs`.
- **GitHub · Telotia/Assay** — `github.com/Telotia/Assay` — the prompt-sweep harness upstream of Principia. Not yet read.

Future readers with access to these repos should re-derive the Vivarium UI kit from real component code (`shared-types/src/kernel-events.ts`) rather than from this kit's extrapolation.

---

## What Telotia / Principia is

**Telotia** is a pre-incubation AI startup studying *teleology in epistemic lives* — the question of what it means for a reasoning system to be anchored to a goal it cannot abandon.

**Audience for this design system, today:** internal team, potential clients, and investors. There is no public marketing site yet; the `telotia-site` kit here is the prepared surface for that conversation, not a live property.

**Principia** is the product brand. Two readings, both true:

1. **Externally** — a claim-validation runtime for enterprise AI teams. AI vendors make buyer-facing claims (eval reports, RFP responses, security questionnaires, sales decks, diligence packets); Principia lives inside one of those claims and crystallizes what the engagement honestly earned.
2. **Internally** — an epistemic being. A Rust runtime that takes a single seed — *"Most randomness has hidden structure."* — and lives inside it as a coherent investigation until that seed is operationally exhausted or shown to have no productive framing left.

The two readings share one architecture: **Chambers** (Telos, Inspection, Synthesis, Debate, Experiment, Slice, Symbiosis-Outbound, Symbiosis-Inbound) oscillating Constructor → Critic → Stabilizer until the engagement crystallizes a **Context**.

The cycle of life is:

> Telos crystallizes → Synthesis releases a Slice → Debate stabilizes a Theory → Experiment produces Evidence → Slice judges Proven / Falsified / Partial → loop, until no sound new Slice can be generated. **Mortality is the only natural death.**

This vocabulary is the design system's grammar. Buttons crystallize. Pills carry verdicts. Cards represent Slices. The UI does not market itself; it *records*.

---

## Index

| File | Purpose |
|---|---|
| `README.md` | this document |
| `SKILL.md` | invocation contract for the Claude Code / agent-skill form |
| `colors_and_type.css` | CSS variables for the whole system — paper, ink, night, verdicts, type scale |
| `assets/` | logos (Principia, Telotia), constellation backgrounds, chamber + UI icon sprite |
| `preview/` | small cards that surface in the Design System tab |
| `ui_kits/vivarium/` | the operator control plane — kernel monitor, slice list, event log, chamber graph |
| `ui_kits/telotia-site/` | the public-facing marketing site for Telotia + Principia |

---

## Content fundamentals

The voice is **a careful thinker speaking in their own voice** — never a product team, never a coding assistant. Borrow directly from the canonical ontology and the chamber prompts: that *is* the tone.

### Rules

- **No marketing softening.** From `RELEASING.md`: ban *"we're excited to announce…"*, *"blazing fast"*, *"powerful new"*. Releases describe what *the organism* moved this cycle, not what the diff did.
- **Plain English, present tense.** *"The dish runs. The frontier moves. The ontology stops obvious foot-guns."*
- **Italics carry stress, not decoration.** When you want emphasis, use serif italics: *"Mortality is the only **natural** death."*
- **Casing convention.** The **TELOTIA** wordmark is set in IBM Plex Sans 500, all caps, with 0.22em tracking — the organisation reads like a small-caps imprint stamped onto the page. The **Principia** wordmark is set in Newsreader, mixed case — the product carries the book voice. In body prose, refer to *Telotia* and *Principia* as proper nouns (title-case); reserve all-caps for the mark itself.
- **Honest assessments are a section type.** Every release ends with one. Replicate in marketing copy: ship the limitations alongside the wins.
- **No emoji.** None. The product is an epistemic being; emoji are a tonal break.
- **First person plural is rare.** We do not say *"we built…"* — we say *"the kernel routes…"*, *"the Stabilizer crystallizes…"*.

### Vocabulary (use precisely; do not rebrand)

| Term | Meaning |
|---|---|
| **Chamber** | An oscillating unit of work (Constructor → Critic → Stabilizer). |
| **Constructor** | The role that proposes. |
| **Critic** | The role that presses — *on the same team as the Constructor*. |
| **Stabilizer** | The role that judges. *Not* the Chamber's salesperson. |
| **Oscillation** | One Constructor → Critic turn. |
| **Crystallize** | The act of writing an immutable Context. |
| **Crystallized Context** | An immutable record `ctx_<type>_<hex>` of a Chamber's output. |
| **Slice** | A defensible, independently investigable position about the Telos. |
| **Verdict** | One of `Proven` / `Falsified` / `Partial` (default). |
| **Telos** | The organism's anchor seed. |
| **Mortality** | The only natural death. Emitted as `TELOS_CLOSED`. |
| **Symbiosis** | Outbound commission to another organism; Inbound re-housing of its result. |

### Example copy

**Bad** (generic SaaS): *"Validate AI vendor claims in seconds with Principia's powerful AI-driven engine."*

**Good** (in voice): *"Principia takes a single claim and lives inside it as a coherent investigation. It crystallizes what the engagement honestly earned. Mortality is the only natural death."*

**Status copy** — read like ontology, not status pages:

- *"oscillation_check · verdict=ITERATE"*
- *"apparatus failed — max_tokens"*
- *"`TELOS_CLOSED: framings exhausted across three Open Slice cycles.`"*

---

## Visual foundations

### Motif

Two motifs run through everything:

- **The manuscript** — parchment paper, ink, hairline rules, small-caps section labels, marginalia, italics for stress. The system reads like a printed scholarly book.
- **The constellation** — chambers are stars; oscillations are the lines drawn between them. Used as background on dark surfaces (the event log, the chamber-graph view, the marketing hero). Never used decoratively; always carries the chamber graph or the kernel's structure.

### Colors

See `colors_and_type.css` and `preview/colors-*.html`.

- **Paper** — `#F5F0E6` parchment, `#ECE5D5` bone (raised), `#E2D9C3` vellum (inset wells), `#D6CAAE` edge.
- **Ink** — six-step sepia from `#1A1612` to `#C9BFA7` rule.
- **Ocean** — the radial-gradient navy that anchors every night surface. From `#213D6F` near-surface light → `#0F1F44` mid → `#060D22` abyss. Used on the marketing hero, the chamber-graph card, the runtime event log, and any logo stage. **`--ocean` is the primary background treatment**, not `--paper` — paper is the secondary surface.
- **Night** — flat `#0A1430` fallback (rarely used directly; the ocean gradient is the default).
- **Rose gold** — `#DEA193` is the single accent. Replaces gold; reads warm against navy without ever looking like fintech orange. Use sparingly: an italicized word, an active chamber, a live indicator. The rose-soft `#B07A6A` is the deeper variant for hairlines and secondary emphasis.
- **Verdicts** — sealed-wax red (Falsified), inked green (Proven), amber (Partial), slate blue (Open), dusk plum (TELOS_CLOSED).
- **Synthesis bloom** — `#6B4A8B` is used sparingly for the chaotic-dynamics surface (synthesis chamber labels, attractor visualizations).

### Type

| Role | Family | License | Notes |
|---|---|---|---|
| Display | **Newsreader** | SIL OFL · free for commercial | humanist serif. Stressed italics. Loaded via Google Fonts; drop self-hosted files into `fonts/` if you'd rather not depend on Google's CDN. |
| Body | **IBM Plex Sans** | SIL OFL · free for commercial | institutional, neutral, reads like a kernel manual. |
| Mono | **IBM Plex Mono** | SIL OFL · free for commercial | every context ID, every event-log line, every chamber state. |
| Small-caps label | IBM Plex Sans, `letter-spacing: 0.16em`, `text-transform: uppercase`, 11px | — | the Principia signature. |

**Italics are reserved.** Display italics are stressed, never decorative. Body italics carry meaning (a verdict, a state).

### Spacing

8 pt grid anchored to 4: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`. Cards have generous internal padding (≥ 16px) and live on a quiet baseline grid; the manuscript needs air.

### Backgrounds

- **Paper** — flat `#F5F0E6`, no gradient. Optional `.grain` overlay (two-radial-gradient dot noise) at ≤ 35% multiply, used sparingly.
- **Ocean** — `var(--ocean)` (a radial navy gradient) is the **primary** background treatment. Apply to hero sections, logo stages, the runtime event log, the chamber-graph card. Layer a `radial-gradient(#ffffff20 0.7px, transparent 0.8px)` dot pattern on top for the star-field effect.
- **No image hero backgrounds.** Imagery, if it appears at all, is observational (a real graph, a real event stream). No stock photography. No abstract gradients beyond the ocean.

### Animation

- **Easing** — `cubic-bezier(.2,.6,.2,1)` "paper". The system settles; it does not bounce.
- **Duration** — 120ms for state changes, 200ms for layout, 420ms for the slow ceremonial things (a Crystallize action, a verdict reveal). Default `prefers-reduced-motion`.
- **Heartbeat dot** — the only continuous animation; on the runtime event log, a 1.2s pulse on running chambers. Everything else is event-driven.
- **No bounces. No springs. No fades over 500ms.** The aesthetic is "settled into place," not "playful."

### Interaction states

- **Hover** — darken background by one step (`paper` → `paper-2`), or for ink buttons go to pure black. Borders go from `--rule` to `--ink-3` to `--ink` on focus.
- **Press** — no shrink. A 1px inset shadow on the pressed side. The page is paper; it does not bounce.
- **Focus** — 1px solid `--ink` ring inset, *not* a glow. Use a `box-shadow: inset 0 0 0 1px var(--ink)`.
- **Disabled** — 45% opacity. No greyscale filter.

### Borders & rules

- **Hairlines everywhere.** 1px `--rule` (`#C9BFA7`) is the system's primary divider. Most "card" boundaries are a single hairline, not a heavy stroke.
- **No double borders.** Either border or shadow, not both, except on the lifted `--elev-2` card pattern.

### Shadows

Shadows are *paper-edge*, not glass. They sit directly under the element and read like the next sheet of paper showing through:

```
--elev-1: 0 1px 0 var(--paper-edge);
--elev-2: 0 1px 0 var(--paper-edge), 0 2px 8px -4px #1a161210;
--elev-3: 0 2px 0 var(--paper-edge), 0 8px 24px -10px #1a161222;
```

No coloured glows, no neon outlines, no neumorphism.

### Cards

A card is **a sheet of paper on the page**. Rules:

- 1px `--rule` border (always)
- `--r-3` (8 px) corners; small actions use `--r-2` (4 px); badges use `--r-full`
- `--paper-2` (`#ECE5D5`) fill when raised; `--paper-3` when inset
- Internal padding ≥ 16 px (most cards 18 – 20 px)
- Hairline divider for in-card sections, not a thicker line

### Transparency & blur

- **Avoid blur.** The kernel is precise; frosted glass reads as "vibes," not record.
- Use opacity for emphasis (`opacity: .55` for background constellations, `opacity: .45` for tertiary marks). Do not stack opacity layers.

### Layout

- **Fixed top bar.** 56 px, hairline base, sits over scrolling content. Always shows brand, current Telos session id, and run state.
- **Fixed left rail.** 64 px, chamber glyph nav. Optional `expanded` state widens to 240 px and adds labels.
- **Marginalia.** Long-form pages may use a left or right margin column for context IDs, timestamps, oscillation counts — the way a printed book uses marginalia.
- **Max content width** — body prose ≤ 680 px. Dashboards span 1280 – 1600 px before splitting.

---

## Iconography

The system ships **three** kinds of icon, in this order of preference:

1. **Chamber glyphs** (`assets/icons.svg` symbols `#ch-telos` … `#ch-mortality`) — bespoke, one per chamber. Always use these when referencing a chamber.
2. **Generic UI icons** (`assets/icons.svg` symbols `#i-*`) — a small set (arrow, chevron, play, pause, search, clock, terminal, doc, check, x, plus, more, pulse, branch, settings, copy, external). Single-weight (1.2 px), rounded caps and joins, 24 × 24 viewbox, designed to sit beside Plex Sans at 13 – 15 px.
3. **Constellation marks** — the Principia and Telotia logos are themselves constellations (`assets/principia-mark.svg`, `assets/telotia-mark.svg`).

Substitution rules:

- **If a needed icon is missing**, look first to **Lucide Icons** (`https://lucide.dev`) for the closest match by stroke weight, then re-draw it into the local sprite. Flag substitutions in commit messages.
- **No emoji.** The product is an epistemic being; emoji are a tonal break. If the codebase introduces one, treat it as a bug.
- **No unicode used as icon.** `→ ★ ⊛` etc. appear only in body copy where they read as typography (e.g. small section dividers), never as a UI affordance.
- **No coloured icon sets** (no Heroicons-solid, no fluent-emoji). Icons inherit `currentColor`.

### Where icons go

- **Chamber glyphs** — chamber labels in lists, chamber tabs, the chamber graph nodes.
- **UI icons** — buttons, breadcrumbs, status indicators. Always paired with a label unless the meaning is unambiguous (e.g. `more` in a row context).
- **Decorative constellations** — `assets/constellation-bg.svg` for the marketing hero only. Never behind a data surface.

---

## UI kits

- **Vivarium** (`ui_kits/vivarium/`) — the operator control plane. Dashboard, telos session detail, slice list, event log, chamber graph. **Internal tooling only — not a public surface.**
- **Telotia site** (`ui_kits/telotia-site/`) — the prepared public surface, audience-scoped to potential clients and investors at the pre-incubation stage. Hero, manifesto, install, ontology preview, honest assessment.

See each kit's README for which screens and components are implemented.

---

## Caveats

- **No real fonts shipped locally.** Newsreader and IBM Plex are pulled from Google Fonts at runtime — all three are SIL OFL and free for commercial use. If you want to self-host (and avoid Google's CDN), download the WOFF2 files from `fonts.google.com` into `/fonts` and override `@font-face` in `colors_and_type.css`.
- **Vivarium UI is an extrapolation.** The Vivarium repository has not been read yet; the operator UI in `ui_kits/vivarium/` is built from the kernel's event vocabulary, README, and `events.rs`. Re-derive from the real Vivarium code when accessible.
- **No real product screenshots.** The kernel is a CLI; there are no existing UIs. Everything visual here is a first-position proposal.

---

## License

Proprietary. © Telotia. The design system inherits the parent project's license.
