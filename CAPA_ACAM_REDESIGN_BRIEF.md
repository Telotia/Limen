# CAPA / Canadian Health Equipment Audit Website Redesign Brief

## 0. Purpose

This document is the implementation brief for a major redesign of the current Telotia/Limen site into a serious Canadian health-equipment audit and proof-validation website.

The client context is regulated, cross-border, and evidence-heavy:

- The buyer-side use case is a U.S. importer preparing proof and validation material for Canadian review.
- The category is health equipment / medical-device-adjacent quality review, not a playful AI product launch.
- The interface must feel rigorous, trustworthy, and operationally useful.
- The site can be beautiful, but never decorative for its own sake.
- All current core product content should be preserved, but expressed through diagrams, app UI, proof artifacts, and data visuals rather than long text-only narrative.

Primary direction:

- White, black, green, yellow.
- No purple.
- No cursive or script fonts.
- No day/night mode toggle.
- One unified institutional visual system.
- Particle visuals are allowed, but they must feel biological, molecular, inspection-grade, and scientific.

## 1. Source References And How To Use Them

### 1.1 CAPA-ACAM

Reference: https://capa-acam.ca/

Use only for institutional healthcare cues:

- Canadian healthcare association tone.
- Certification, membership, governance, policy, and contact patterns.
- Bilingual expectation signals such as English/French readiness.
- Clear footer structure with address, phone, email, quick links, copyright.

Do not copy its visual style directly. It is content-structure inspiration only.

### 1.2 RDQCC

Reference: https://www.rdqcc.us/

The user explicitly said not to use RDQCC as a visual style reference. Use it only for business-adjacent content themes:

- Defect detection.
- Product quality.
- Risk-based decision support.
- Non-conformities.
- Manufacturing-floor inspection.
- Failure modes and risk-analysis cases.

Convert these ideas into health-equipment audit language:

- Product defect evidence.
- Inspection image review.
- Risk classification.
- Import readiness.
- Traceable proof package.
- Quality event documentation.

Do not reuse RDQCC's look, layout, or marketing tone.

### 1.3 Credo AI

Reference: https://www.credo.ai/

Use Credo only as a structural reference for showing a complex governance system visually:

- Large explanatory hero paired with a system diagram.
- Evidence and compliance concepts shown as orbiting nodes.
- Important metrics shown as proof points.
- "Governance platform" style information hierarchy.

Do not copy Credo's purple/pink AI-governance palette. Replace with black, white, green, and yellow.

### 1.4 Particle / Biological Visual References

Local references:

- `C:/Users/whyke/Documents/Dianoetica/Capa/a9d61759681482716a33889176521ff7.mp4`
- `C:/Users/whyke/Documents/Dianoetica/Capa/2b5e1b77e3d26c178afec6cb843d8d59.mp4`
- `C:/Users/whyke/Documents/Dianoetica/Capa/a9d61759681482716a33889176521ff7.jpg`
- `C:/Users/whyke/Documents/Dianoetica/Capa/2b5e1b77e3d26c178afec6cb843d8d59.jpg`
- `C:/Users/whyke/Documents/Dianoetica/Capa/1.png`
- `C:/Users/whyke/Documents/Dianoetica/Capa/2.png`
- `C:/Users/whyke/Documents/Dianoetica/Capa/3.png`

Use these for motion and form language:

- Particle clouds that assemble into molecule-like or cell-like structures.
- Dense points with controlled spacing, not random glitter.
- Biological, fluid movement with clear scientific restraint.
- Green particles on dark charcoal or off-white backgrounds.
- The particle model should support the message: "evidence is decomposed, traced, and validated."

Avoid:

- Galaxy fantasy.
- Neon sci-fi.
- AI-purple gradients.
- Overly magical swarms.
- Particle effects that obscure the text.

## 2. Skill References To Follow

### 2.1 Local Slash Commands

The following local Claude Code commands should inform the redesign standards:

1. `/taste-skill`
   - Use for overall design-taste guardrails.
   - Keep design variance high enough to avoid generic SaaS, but reduce motion intensity because this is a regulated health-equipment site.
   - Enforce no AI-purple, no generic centered hero, no custom cursor, no fake data, and no decorative glows.

2. `/redesign-skill`
   - Use as the audit checklist.
   - Replace generic fonts, generic card grids, weak hover states, vague content, and default-looking sections.
   - Preserve functionality while improving layout, typography, color, and component quality.

3. `/soft-skill`
   - Use selectively for premium polish.
   - Borrow the idea of agency-level refinement, subtle inner borders, tinted shadows, and composed section rhythm.
   - Do not import its luxury/ethereal tone wholesale. This project must stay clinical and proof-oriented.

4. `/output-skill`
   - Use as execution discipline.
   - No partial implementation.
   - No placeholder sections.
   - No "TODO" blocks.
   - Every content section must be finished enough to review visually.

5. `/minimalist-skill`
   - Use as the strongest style reference.
   - Warm off-white, charcoal, sparse accent color, clean borders, generous spacing.
   - Motion should be functional and quiet.
   - This is the best fit for a rigorous Canadian health-equipment audit site.

6. `/brutalist-skill`
   - Use only for a small amount of inspection/telemetry language.
   - Borrow strict grids, metadata labels, monospaced identifiers, and audit-trail structure.
   - Do not use brutalist harshness, red hazard style, square-only corners, or aggressive terminal aesthetics as the main look.

### 2.2 Skills Listed In The Reference Image

The image lists six webpage/PPT skill references. Treat them as inspiration inventory, not dependencies:

1. `guizang-ppt-skill`
   - Use for presentation-grade layout rhythm and strong hierarchy.
   - Reference: https://github.com/op7418/guizang-ppt-skill

2. `beautiful-html-templates`
   - Use for polished HTML section composition and exportable web/PPT thinking.
   - Reference: https://github.com/zarazhangrui/beautiful-html-templates

3. `kami`
   - Use for clean visual arrangement and template discipline.
   - Reference: https://github.com/tw93/Kami

4. `Anthropic Front-End Design`
   - Use for mature frontend taste and restrained component systems.
   - Reference: https://github.com/anthropics/skills/tree/main/skills/frontend-design

5. `Design DNA`
   - Use for extracting repeatable design tokens, visual motifs, and page rhythm.
   - Reference: https://github.com/zanwei/design-dna

6. `html-anything`
   - Use for turning a design direction into complete HTML/CSS artifacts.
   - Reference: https://github.com/nexu-io/html-anything/tree/main

Also reference the external taste skill mentioned by the user:

- https://github.com/Leonxlnx/taste-skill

Use these references to raise quality, not to add visual clutter.

## 3. Positioning

### 3.1 One-Sentence Product Position

Evidence review software for health-equipment import and certification teams that decomposes product documentation into checkable claims, searches only the trusted evidence base, and produces citation-linked verdicts.

### 3.2 Audience

Primary:

- U.S. health-equipment importers preparing Canadian documentation.
- Quality assurance teams.
- Regulatory affairs teams.
- Compliance and documentation managers.
- Audit-preparation consultants.

Secondary:

- Canadian reviewers.
- Procurement teams.
- Internal legal/compliance stakeholders.
- Device-manufacturer quality leaders.

### 3.3 Trust Requirements

The page must communicate:

- Traceability.
- Evidence discipline.
- Canadian readiness.
- Human review.
- No black-box final decisions.
- No autonomous regulatory claims.
- No unsupported promises.

The site should not say or imply:

- "We certify devices."
- "We guarantee Canadian approval."
- "AI replaces regulatory review."
- "Unsupported means false."
- "The tool decides safety."

## 4. Naming And External Language Rules

### 4.1 Remove Or De-Emphasize Old Internal Terms

Do not use the old internal language externally:

- No `Vivarium`.
- No `Principia`.
- No `organism`.
- No `telos`.
- No cosmic/epistemic language.
- No poetic philosophical framing.

If existing code still uses these identifiers internally, do not surface them in visible website copy.

### 4.2 Replace With External Terms

Use:

- Evidence review.
- Claim review.
- Proof package.
- Import readiness.
- Source passage.
- Audit trail.
- Verification workspace.
- Trusted corpus.
- Document run.
- Health-equipment documentation.
- Canadian review package.

### 4.3 AI Language

Use "automation" or "evidence review system" before using "AI."

Allowed:

- Assisted evidence review.
- Automated decomposition.
- Model-assisted inspection.
- Risk-based review support.

Avoid:

- AI magic.
- Future of AI.
- Autonomous reviewer.
- AI governance language unless the section specifically explains internal model controls.

## 5. Visual System

### 5.1 Style Summary

The look should be clinical, precise, and premium:

- Canadian health institution meets quality-control inspection system.
- Calm off-white pages.
- Charcoal text.
- Deep green surfaces.
- Muted yellow/gold for proof, evidence, and caution.
- Thin lines, carefully spaced diagrams, and restrained particle models.

### 5.2 Palette

Base:

- Off-white: `#F7F8F3`
- Clean white: `#FFFFFF`
- Charcoal: `#111713`
- Near-black green: `#030F13`
- Deep green: `#123C35`
- Inspection green: `#31988A`
- Pale evidence yellow: `#D8D29B`
- Muted amber: `#C8A84E`
- Soft line: `rgba(17, 23, 19, 0.12)`
- Dark line: `rgba(216, 210, 155, 0.18)`

Download block gradient:

```css
linear-gradient(110deg, #d8d29b 0%, #31988a 48%, #030f13 100%)
```

Usage:

- Off-white dominates the website.
- Charcoal/near-black is used for the hero dark panel, download panel, and app UI.
- Green is the core scientific/health signal.
- Yellow/gold is reserved for evidence, caution, proof, and validated trace lines.

### 5.3 Forbidden Color Choices

Do not use:

- Purple.
- Pink.
- Neon cyan.
- AI blue/purple gradients.
- Pure black `#000000`.
- Pure white as the entire page background without texture or warmth.

### 5.4 Typography

No script fonts. No cursive. No high-fashion serif.

Recommended:

- Display / headings: `Satoshi`, `Geist`, `Cabinet Grotesk`, or `Avenir Next`.
- Body: `Geist`, `IBM Plex Sans`, or `Satoshi`.
- Data / audit labels: `IBM Plex Mono`, `JetBrains Mono`, or `Geist Mono`.

Rules:

- Use sans-serif for all headings and body.
- Use monospace only for metadata, claim IDs, timestamps, evidence references, and audit logs.
- Keep headings strong but not theatrical.
- Use sentence case for most headings.
- Use uppercase only for small labels and table headings.

### 5.5 Layout Tone

Avoid generic SaaS layouts:

- Do not create a centered headline with three equal cards beneath it.
- Do not use a marketing hero that feels like a consumer app.
- Do not use decorative cards everywhere.

Use instead:

- Split hero: left text, right scientific particle model / proof diagram.
- Asymmetric grids.
- Evidence tables.
- Step diagrams.
- Thin-line process maps.
- App UI screenshots or mockups.
- Proof package preview panels.

## 6. Motion And Particle Direction

### 6.1 Motion Intensity

Motion should feel alive but serious.

Target:

- Motion intensity: 4 out of 10.
- Design variance: 6 out of 10.
- Visual density: 5 out of 10.

Allowed:

- Slow particle drift.
- Smooth claim-line drawing.
- Subtle hover states.
- Small app UI state changes.
- Process-step highlight on scroll.

Not allowed:

- Cursor replacement.
- Fast twinkling stars.
- Galaxy-style fantasy.
- Scroll hijacking.
- Excessive parallax.
- Large animated blobs.
- Neon glows.

### 6.2 Particle Biology Model

Create a biological/medical particle system that can appear in the hero and supporting diagrams.

Visual idea:

- Particles assemble into a molecular chain, cell membrane, or proof graph.
- The model should imply health equipment inspection and evidence traceability.
- Use small pale green and yellow particles.
- Keep particle density lower near text.
- Allow particles to cohere into nodes, rings, or molecular bonds.

Implementation guidance:

- Use canvas or SVG.
- Animate only transform and opacity when possible.
- If canvas is used, resize by device pixel ratio.
- Respect `prefers-reduced-motion`.
- On mobile, the particle model must move behind text or collapse into a smaller static diagram.

### 6.3 Six-Star Orbit Diagram

Create one central diagram with six orbiting nodes. Use this to explain verdicts and vocabulary.

Center:

- "Evidence package" or "Claim review"

Six nodes:

1. Supported
2. Partial
3. Unsupported
4. Atomic claim
5. Evidence base
6. Decomposition

Visual style:

- Thin orbit lines.
- Six small star-like or molecule-like nodes.
- Gold/yellow for verdict states.
- Green for evidence concepts.
- Monospace micro-labels.
- Very light motion: nodes can drift by 1-2px or pulse opacity slowly.

Do not make it look like astrology or fantasy constellations. It should read as a scientific process diagram.

## 7. Required Content To Preserve And Visualize

The current product content must stay, but the new page should present it visually.

### 7.1 Three-Step Process

Use a beautiful step diagram, not plain text.

Recommended structure:

- A horizontal process diagram on desktop.
- A vertical timeline on mobile.
- Each step has a number, title, concise body, and visual micro-diagram.
- A claim object travels from document to evidence base to verdict.

Exact content to preserve:

#### Step 1 - Decompose

We break the document into atomic claims, down to the level where each one can be checked on its own. Not paragraphs - individual propositions, each independently verifiable.

Visual:

- Document sheet breaks into small claim fragments.
- Each fragment receives a claim ID.
- Use green nodes and thin black connector lines.

#### Step 2 - Search The Evidence

Each claim is matched against your evidence base - the corpus you supplied, not the open web. The search is scoped to what you trust and can cite.

Visual:

- Claim node queries a locked corpus.
- Show "supplied corpus" as a bounded container.
- Show no open-web iconography.

#### Step 3 - Grade And Cite

Every claim gets a graded verdict - Supported, Partial, or Unsupported - each linked to the exact source in your corpus. No aggregate scores, no summaries.

Visual:

- Three verdict lanes.
- Each lane links to a source passage.
- Show citation pins or page references.

### 7.2 Verdict Vocabulary

Use the six-star orbit diagram plus detailed definition panels.

#### Verdict - Supported

Evidence in the corpus backs the claim. The supporting passage is retrieved and cited exactly.

Visual state:

- Green/yellow confirmed line.
- Source passage attached.
- Label: `SUPPORTED`

#### Verdict - Partial

Some of the claim is backed; part is not, or only holds under specific conditions. Graded, non-binary - not collapsed to true or false.

Visual state:

- Split line, part green and part amber.
- Condition badge.
- Label: `PARTIAL`

#### Verdict - Unsupported

This corpus is silent on the claim - not that the claim is wrong. Results are a starting point for a human reviewer, not a final verdict on the work.

Visual state:

- Quiet charcoal line.
- Empty evidence slot.
- Label: `UNSUPPORTED`

### 7.3 Nouns

#### Atomic Claim

A single proposition that can be checked independently. Telotia decomposes documents to this level before searching.

Potential external rewrite:

"A single proposition that can be checked independently. The system decomposes documents to this level before searching."

#### Evidence Base

The corpus you supply and trust. Telotia checks claims against this - not the open web. You choose what counts as evidence.

Potential external rewrite:

"The corpus you supply and trust. Claims are checked against this - not the open web. You choose what counts as evidence."

#### Decomposition

Breaking a document into its individual atomic claims, each independently checkable. The first step before any search or grading.

### 7.4 Important Data To Show

Do not invent fake regulatory success rates. Use product-process data and transparent example data instead.

Suggested data modules:

- `18` atomic claims extracted from an example document.
- `47` corpus documents in the trusted evidence base.
- `3` verdict types.
- `0` open-web sources used.
- `1` citation-linked source passage per supported claim.
- `100%` of displayed verdicts must link to source passages in the mockup. This is a UI rule, not a performance claim.

If using real customer or importer data, label it clearly and cite its origin.

## 8. Page Structure

### 8.1 Header

Keep it practical:

- Logo / product name.
- Nav: Process, Evidence, Review UI, Download, Contact.
- Secondary: Documentation or Request access.

No theme toggle.
No philosophy labels.
No internal product names.

### 8.2 Hero

Goal:

Immediately communicate evidence review for Canadian health-equipment import documentation.

Suggested hero copy:

```text
Health-equipment claims need proof.
We turn documentation into citation-linked evidence review.
```

Supporting copy:

```text
For teams preparing Canadian review packages, the workspace decomposes product documentation into atomic claims, checks only the trusted evidence base you provide, and returns Supported, Partial, or Unsupported verdicts with exact source passages.
```

Hero visual:

- Right side: biological particle model assembling into a claim/evidence graph.
- Left side: headline, concise body, two CTAs.
- CTAs: "See the review flow" and "Request access."

Hero must not:

- Use cursive wordmarks.
- Use purple.
- Use philosophical language.
- Feel like a generic AI startup.

### 8.3 Proof Pipeline Section

Use the three-step process from section 7.1.

Design:

- One large process rail.
- Document card at left.
- Evidence base node in the middle.
- Verdict package at right.
- Each step expands or highlights on hover.

### 8.4 Evidence Vocabulary Section

Use the six-node orbit diagram.

Desktop:

- Left side: orbit diagram.
- Right side: definitions in a clean table or stacked panels.

Mobile:

- Orbit diagram first as a compact static illustration.
- Definitions collapse into a vertical list.

### 8.5 App UI Section

Retain the previous app UI concept, but recolor and rename visible labels.

Current app UI should stay because it shows the product. Rework the visual style:

- Replace blue/purple with black, white, green, and yellow.
- Background: off-white or near-black green depending on component context, but no theme toggle.
- App shell: charcoal/green.
- Main content panels: off-white.
- Event log: near-black green with yellow/green status dots.
- Graph lines: muted green and gold.
- Verdict cards: clean white/green/yellow status lines.

Visible UI labels should become external:

- `Document review`
- `Evidence base`
- `Claim graph`
- `Verdict queue`
- `Source passage`
- `Audit trail`
- `Human reviewer`

Avoid visible labels:

- `Vivarium`
- `Principia`
- `Telos`
- `Chamber`
- `Organism`

If the internal code still calls things chambers/slices, keep that in code only.

### 8.6 Download Section

Retain the download block concept and particle ripple, but recolor.

Gradient:

```css
#d8d29b -> #31988a -> #030f13
```

Recommended copy:

```text
Download the review workspace for Windows
```

Supporting copy:

```text
Run document reviews, inspect claim traces, and prepare evidence-linked proof packages in one local desktop surface.
```

Buttons:

- `Download for x64`
- `Download for ARM64`

Button URLs:

- Keep `about:blank` until real signed release URLs exist.
- Do not link to old Telotia/Principia GitHub release URLs.

Visual:

- The particle ripple should use the requested gradient colors.
- Keep the block dark enough that white text remains accessible.
- No custom cursor.
- No Norma constellation cursor.

### 8.7 Contact / Conversion Section

Tone:

- Serious.
- Low pressure.
- Built for compliance conversations.

Suggested modules:

- `Request access`
- `Talk to review team`
- `Send a sample document`
- `Prepare a Canadian evidence package`

Avoid:

- "Get started in seconds."
- "Unleash."
- "Revolutionize."
- "Future of compliance."

## 9. App UI Detailed Recoloring

### 9.1 App Shell

```css
--app-bg: #030f13;
--app-panel: #f7f8f3;
--app-panel-soft: #eef3eb;
--app-text: #111713;
--app-muted: #66736b;
--app-line: rgba(17, 23, 19, 0.14);
--app-green: #31988a;
--app-green-deep: #123c35;
--app-gold: #d8d29b;
--app-amber: #c8a84e;
```

### 9.2 Status Semantics

- Supported: green line plus pale yellow citation pin.
- Partial: amber line plus split indicator.
- Unsupported: charcoal/gray line plus quiet empty evidence marker.
- Active review: green dot.
- Needs human review: amber dot.

### 9.3 App Layout

Use a fixed, professional layout:

- Top bar: product mark, document run ID, reviewer status.
- Left rail: icon-only steps, no whimsical icons.
- Main panel: document claim and graph.
- Right panel: audit trail / source passages.
- Bottom drawer: verdict queue.

Make the mockup interactive:

- Clicking a claim changes the verdict detail.
- Clicking a verdict card highlights the corresponding graph node.
- Source passage appears in a detail drawer.
- Empty state exists when no claim is selected.

## 10. Content Migration Plan

### 10.1 Preserve

Keep:

- Three-step explanation.
- Verdict definitions.
- Noun definitions.
- Interactive app mockup.
- Download block.
- Evidence review positioning.
- Citation-linked proof language.

### 10.2 Rewrite

Rewrite:

- Any old philosophical copy.
- Any internal runtime copy.
- Any "epistemic being" language.
- Any AI-first language.
- Any Telotia/Principia/Vivarium visible language if the site is now for CAPA/health-equipment review.

### 10.3 Add

Add:

- Canadian import readiness framing.
- Health-equipment document review framing.
- Human reviewer framing.
- Proof package framing.
- Bilingual readiness indicator if appropriate.
- Clear disclaimer that the product supports review and does not grant regulatory approval.

## 11. Interaction Requirements

### 11.1 Must Have

- Sticky nav.
- Smooth section anchor scrolling.
- Responsive particle visual.
- Interactive app UI.
- Hover/focus/active states for buttons and cards.
- Reduced-motion fallback.
- Mobile layout that never creates horizontal scroll.

### 11.2 Must Not Have

- Custom mouse cursor.
- Theme switcher.
- Fast flashing particles.
- Purple gradients.
- Cursive fonts.
- Generic equal-card feature rows.
- Decorative motion that hides text.
- Fake compliance claims.

## 12. Accessibility And Compliance

This site must feel audit-ready technically as well as visually.

Requirements:

- Use semantic landmarks: `header`, `nav`, `main`, `section`, `article`, `footer`.
- Every interactive control has visible focus.
- Particle canvas has `aria-hidden="true"`.
- App mockup uses labels and buttons where interactive.
- Text contrast passes WCAG AA.
- Motion respects `prefers-reduced-motion`.
- Do not rely on color alone for verdict states.
- Every diagram has nearby text explanation.
- Footer includes privacy/contact/legal links.

## 13. Responsive Rules

Desktop:

- Split hero.
- Large particle model right side.
- App UI full width.
- Six-node orbit diagram beside definitions.

Tablet:

- Particle model moves behind or above the text without becoming a separate awkward block.
- Process diagram can become two-row.
- App mockup remains readable.

Mobile:

- Single column.
- Particle model becomes smaller and partially behind section text.
- Step process becomes vertical.
- Six-node orbit diagram becomes compact.
- App UI can stack: toolbar, claim, graph, verdict queue, audit trail.
- No horizontal scroll.

## 14. Implementation Notes For This Repo

Current repo:

- Astro 6.
- TypeScript.
- Vanilla CSS inside `src/pages/index.astro`.
- Existing canvas animation system in `src/lib/dianoetica/core/engine`.

Recommended implementation approach:

1. Create a new branch before implementation.
2. Keep the app in Astro and existing CSS unless a larger migration is explicitly requested.
3. Remove theme switching UI and JavaScript.
4. Convert global theme variables into one fixed health-audit palette.
5. Replace visible internal content with external health-equipment proof language.
6. Reuse the existing app mockup structure, but rename labels and recolor.
7. Reuse particle/canvas logic, but change visual parameters to biological/molecular green/yellow particles.
8. Keep `about:blank` for download links until real release links exist.
9. Run `npm run check`.
10. Validate with browser screenshots at desktop, tablet, and mobile.

## 15. Section-By-Section Implementation Checklist

### Header

- [ ] Remove theme toggle.
- [ ] Replace nav items with external audience labels.
- [ ] Keep nav sticky.
- [ ] Ensure mobile nav fits without overflow.

### Hero

- [ ] Replace title and copy with health-equipment proof positioning.
- [ ] Use sans-serif.
- [ ] Add biological particle model.
- [ ] Keep text readable over animation.
- [ ] Add two CTAs.

### Proof Pipeline

- [ ] Build the 3-step diagram.
- [ ] Preserve exact step meaning.
- [ ] Add claim ID and corpus ID visual details.
- [ ] Support mobile vertical timeline.

### Verdict Vocabulary

- [ ] Create six-node orbit visual.
- [ ] Include three verdicts and three nouns.
- [ ] Do not over-card the layout.
- [ ] Use yellow/green semantic markers.

### App UI

- [ ] Preserve previous interactive app UI concept.
- [ ] Replace color system.
- [ ] Rename visible labels.
- [ ] Keep click interactions.
- [ ] Add empty state and detail state.

### Download

- [ ] Keep download block.
- [ ] Use gradient `#d8d29b -> #31988a -> #030f13`.
- [ ] Use white text on dark block.
- [ ] Keep buttons to `about:blank`.
- [ ] Remove custom cursor.

### Footer

- [ ] Include contact.
- [ ] Include legal links.
- [ ] Include short compliance disclaimer.
- [ ] Avoid decorative hero graphics in footer.

## 16. Copy Draft

### Hero Draft

```text
Health-equipment claims need proof.
We turn documentation into citation-linked evidence review.
```

```text
For teams preparing Canadian review packages, the workspace decomposes product documentation into atomic claims, checks only the trusted evidence base you provide, and returns Supported, Partial, or Unsupported verdicts with exact source passages.
```

### Pipeline Intro

```text
From product documentation to reviewable proof, every claim is separated, searched, graded, and linked back to source evidence.
```

### App UI Intro

```text
Inspect each claim, its retrieved source passage, and the verdict trail before a reviewer signs off.
```

### Download Intro

```text
Run document reviews, inspect claim traces, and prepare evidence-linked proof packages in one local desktop surface.
```

### Compliance Disclaimer

```text
The workspace supports evidence review and documentation preparation. It does not grant regulatory approval or replace qualified human review.
```

## 17. Final Design Acceptance Criteria

The redesign passes only if:

- It looks like a serious health-equipment audit/proof-validation website.
- It does not look like a generic AI startup.
- It preserves the important product content.
- It turns text-heavy explanations into diagrams and app visuals.
- It uses one fixed black/white/green/yellow style.
- It has no cursive typography.
- It has no purple.
- It has no theme switcher.
- It has no custom cursor.
- The particle system feels biological and scientific.
- The app UI is still visible and interactive.
- The download block remains, with the requested gradient.
- Mobile and tablet layouts are clean.
- `npm run check` passes.
