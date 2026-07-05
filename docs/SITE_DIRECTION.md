# Telotia — Site Content Direction

The structural plan for the Telotia public site (repo: Limen). What each page is, in what order, saying what — keeping the existing ink-wash design. Pairs with [VOICE.md](./VOICE.md) (which words to use). Supersedes the content decisions in [../DESIGN_BRIEF.md](../DESIGN_BRIEF.md) where they conflict.

## Status & job (as of 2026-07)

- **Ship now**, to stand behind the **Centech application**. The site's #1 job is **credibility** — "we exist, here's the idea" — not conversion. Nothing is working yet.
- **CAPA quality investigations (medical devices) is the committed projected product.** Verticals stay explorable internally, but incubators need a hard commitment; the site can be updated anytime during incubation.
- The site is **concept + a clearly-labeled mockup + interest capture** — not a live demo.
- Iterate fast; this is a starting point, not a finished site.

## Positioning

Lead with the **capability in the practitioner's terms** (checking every statement against the evidence), commit to **CAPA / medical devices** as the first build, keep the deeper research identity as *posture* (method, rigor) — never as an unproven "research lab" claim. See VOICE.md for the audience and vocabulary.

## Hero

Direction: **rebalanced split** — a claim-shaped H1 (practitioner language, VOICE.md) on the left, the **Evidence Ledger** mockup on the right, a plain you-bring / we-check / you-get strip pinned to the fold so there is no dead air.

Fixes baked in (from the hero critique):
- **Demote the giant "TELOTIA" watermark** to a small nav wordmark — the headline owns the top-left, not gray letters.
- **No dead lower half** — the hero is content-height, or the fold is filled; no full-viewport emptiness.
- **The showcase is the visual anchor**, not the watermark.
- **Four** evidence chips (Found / Incomplete / Conflicting / None on file), CAPA-anchored rows, each with a source citation.
- **Illustrative label** on the ledger ("the workflow we're building") — no "live" badge, no fabricated run-counts.
- CTAs: `Request a pilot` (primary) + `See how it works` (secondary). Drop "Watch the demo" — it implies something runs.

Alternatives considered (kept for reference): (A) product-on-stage — the ledger full-width as hero; (B) manifesto — the mission line at full scale (too abstract for "grasp it immediately"); (D) pipeline — the mechanism (in -> through -> out) as the visual. C (rebalanced split) is the recommended ship; A is the move if we later restructure the hero for more ambition.

## Sitemap (URLs stable; change content + nav labels only)

```
telotia.com
├── /            index — the one-pager (the site IS this page)
├── /process     nav label "How it works"
├── /workspace   nav label "Walkthrough" — the intended-workflow mockup
├── /demo        drops OUT of nav; page stays live as a thin intro -> /workspace
├── /research    "Research" — method + blog stub
├── /consult     "Request a pilot" (the nav button)
└── /resource/…  leave as-is (incl. the Aquila column — Kecheng's personal project, out of scope)
```

**Index section order:** Hero → How it works (3 steps) → Evidence outcomes (4 chips) → "The first thing we're building" (CAPA) → Walkthrough (labeled mockup) → Research teaser → Request a pilot.

## Per-page directives

| Page | Directive |
|---|---|
| index / CAPA section | Eyebrow "First build." One committed paragraph, present-progressive ("we're building", never "we offer"). The 3-step model as cards: (1) decompose the record into atomic statements -> (2) check against **your internal evidence** — honestly marked *"the hard part — designed, being built"* -> (3) check against **external standards** (21 CFR 820, ISO 13485) — *"public, citable — where the walkthrough starts."* The (2)/(3) split is the honesty rule made visible. |
| Evidence outcomes | Four chips under an EVIDENCE header (VOICE.md translation). Keep the "None on file = silent, not wrong" idea, but the label already carries it. Canonical internal order underneath: supported · partial · contradicted · unsupported. |
| /workspace (Walkthrough) | Keep the interactive mock; swap all "Canadian import" data (run IDs, IFU-22, file names, counts) for the CAPA scenario. **Remove fabricated run-counts/timestamps**, or caption everything "illustrative." Banner: "A walkthrough of the intended review — not a live run." |
| /research | Masthead = the mission line. Sections: Method (short) + Writing (blog list, honest empty state: "First notes are in preparation."). No blog infra yet — hand-write posts as pages when ready. Keep "open benchmark in progress" only if true. |
| /consult | Keep the form + disclaimer. Keep "we reply within two business days" only if it is real. Verify Turnstile + Worker endpoint actually works before shipping; if not wired, submit -> hello@telotia.com fallback — do not ship a dead form. |
| Footer | "private beta" → "paid pilot." Keep the regulatory disclaimer verbatim ("does not provide regulatory approval") — it is the best line on the site. |

## Watchouts

**Voice / honesty** (see VOICE.md): tense discipline (building/designed, never does/has); banned-terms sweep before ship (Norma, customers, design partner, incorporated, IP secured, "in Rust", "verified/compliant", employer names); no numbers presented as real runs.

**Structural (from this repo's history):**
- Nav + footer chrome is **duplicated across all 6 `site/*.html` files** — every nav change is x6, plus the resource hub's own nav.
- `build: { format: 'file' }` (astro.config.ts) → cross-links are bare `process.html` filenames. **Don't rename files** — relative paths at the wrong depth caused PRs #24/#26.
- `smoke:dev` greps the literal string **"Request a pilot"** on the dev homepage — keep that string or update `package.json`.
- Add `og:title` / `og:description` (the one-liner) — evaluators paste links into shared docs.

**Launch ops (the actual deadline path):** the Centech form wants a URL, but **telotia.com still shows "Coming soon"** — the real site only lives on dev. Shipping means the first `dev -> main` release: flip the `LIMEN_ENV=prod` branch of `src/pages/index.astro` to render the real site, **update `smoke:prod`** (it greps "Coming soon" and will fail the deploy the moment the site is real), then the release PR. Budget this.
