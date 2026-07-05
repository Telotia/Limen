---
name: principia-design
description: Use this skill to generate well-branded interfaces and assets for Telotia/Principia — the epistemic-being runtime and the surfaces around it (the Vivarium control plane, the Telotia marketing site, slides, operator tooling). Contains essential design guidelines, colors, type, fonts, assets, and UI-kit components for prototyping or shipping.
user-invocable: true
---

# principia-design

Read `README.md` first; it carries the brand vocabulary, content rules, visual foundations, and an index of every other file. Then explore as needed:

- `colors_and_type.css` — every CSS variable. Import it at the top of any artifact.
- `assets/` — logos, constellation backgrounds, the chamber + UI icon sprite. Copy the files you need; never inline-substitute.
- `preview/` — small reference cards. Useful as in-context examples of how a component looks in this system.
- `ui_kits/vivarium/` — operator control plane (chamber graph, slice list, event log).
- `ui_kits/telotia-site/` — public marketing surface.

## How to use this skill

If creating visual artifacts (slides, mocks, throwaway prototypes), copy the relevant assets out and produce static HTML files for the user to view.

If working on production code, copy the assets in and read the rules so you can act as a designer-engineer fluent in this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask a few focused questions (audience, surface, fidelity, length), and act as an expert designer who outputs HTML artifacts *or* production code depending on the need.

## Non-negotiable rules

- The product voice is *a careful thinker speaking in their own voice* — never a product team, never a coding assistant. No marketing softening. No emoji.
- Use the brand vocabulary precisely: Chamber, Constructor, Critic, Stabilizer, Slice, Telos, Crystallize, Mortality. Do not rebrand.
- Display italics carry stress. Body italics carry meaning. Never decorate with italics.
- Cards are *sheets of paper*: hairline 1px `--rule` border, `--paper-2` fill, ≥ 16 px padding, no double borders, no gradients, no neumorphism.
- Animation is *settled*: 120 – 420 ms, `cubic-bezier(.2,.6,.2,1)`. No bounces. No springs.
- Constellations carry the chamber graph — they are never decorative.
