# IncidentScope Design System

**Design Read:** A trust-first B2B operations product for service providers and AI integrators, expressed through premium utilitarian/editorial structure, inspectable evidence, and restrained motion.

**Source:** Offline `ui-ux-design-pro` engine, then corrected under `taste-skill` hard rules and the minimalist persona.

**Dials:** variance 4/10, motion 3/10, density 5/10.

## Foundation

- Product pattern: real-time operations application with a public value-first landing page.
- Visual system: custom CSS tokens on accessible Radix primitives. Do not mix visual component libraries.
- Image strategy: one generated editorial hero asset at `/incidentscope-scope-hero.png`; no stock photography, fake dashboards, or decorative image grids.
- Iconography: Phosphor regular-weight icons only. Never use emoji as UI icons.
- Theme lock: one coherent light or dark theme per viewport. No alternating inverted sections.

## Color

The engine's evidence-backed navy/sky palette is retained. Sky blue is the only brand accent.

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#F8FAFC` | `#0B1220` |
| Surface | `#FFFFFF` | `#111B2D` |
| Surface muted | `#E8ECF1` | `#182437` |
| Foreground | `#020617` | `#F1F5F9` |
| Muted foreground | `#475569` | `#A9B6C8` |
| Border | `#CBD5E1` | `#334155` |
| Primary navy | `#0F172A` | `#E2E8F0` |
| Accent / CTA | `#0369A1` | `#38A3D1` |
| Destructive | `#B91C1C` | `#F87171` |
| Success | `#166534` | `#4ADE80` |
| Warning | `#92400E` | `#FBBF24` |

- Body text must meet WCAG AA 4.5:1; large text and icons must meet 3:1.
- Do not use gradients, purple, neon, glows, or translucent glass surfaces.
- Semantic colors appear with text or icons, never as color-only meaning.

## Typography

- UI and display: `Plus Jakarta Sans Variable`, self-hosted through `@fontsource-variable/plus-jakarta-sans`.
- Technical identifiers: `JetBrains Mono`, self-hosted through `@fontsource/jetbrains-mono`.
- No serif UI headings and no all-caps sentences.
- Heading tracking: `-0.02em`; body line-height: `1.55`; technical labels line-height: `1.4`.
- Scale: 12, 14, 16, 18, 22, 28, 38, 52 px. The 52 px size is desktop hero only.

## Spacing and layout

- Four-pixel base: 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- Page max width: 1240 px; reading-column max width: 720 px.
- Shell: persistent desktop sidebar plus top utility row; compact bottom navigation on mobile.
- Breakpoints: 640, 768, 1024, 1280 px.
- Verify at 375, 768, 1024, and 1440 px with no horizontal overflow.
- Landing hero is a left-copy/right-illustration split, never a centered dark-mesh hero.

## Shape, depth, and borders

- Inputs and buttons: 8 px radius.
- Cards and panels: 10 px radius.
- Dialogs and menus: 12 px radius.
- Tags and status pills may be fully rounded; containers may not.
- Default depth is a one-pixel border. Cards do not float or lift on hover.
- Shadows are reserved for modal/dialog layering: `0 18px 50px rgba(2, 6, 23, 0.16)`.

## Components

- Primary CTA: solid accent background, white text in light mode, dark navy text in dark mode, 44 px minimum height.
- Secondary CTA: transparent surface, one-pixel border, foreground text.
- Focus: two-pixel accent outline with two-pixel offset. Never remove focus without replacement.
- Inputs: labels remain visible above fields; errors are inline and summarized in an `aria-live` region.
- Tables: use a table for exact mappings, with a stacked labelled-list alternative below 768 px.
- Status: pair icon, concise label, and optional timestamp. Pulsing dots are forbidden.
- Transaction lifecycle: Submitted, Accepted/Decided, Finalized, Failed, Retryable. Refresh canonical state after finalization.
- Empty states: explain why the view is empty and offer one honest next action; never fabricate pools or balances.
- Wallet selection: centered accessible dialog listing every detected provider; never auto-select the first wallet.
- Connected account: clickable address opens an account menu with copy, network, and disconnect actions.

## Motion

- Motion exists only for hierarchy and state feedback: opacity/translate up to 8 px, 160-220 ms, standard ease-out.
- Hover must not move layout, scale cards, or bob controls.
- Loading uses static skeleton contrast or progress text; no pulsing status decoration.
- Respect `prefers-reduced-motion: reduce` by removing transforms and nonessential transitions.

## Information architecture

1. `/` — public landing and trust model.
2. `/pools` — searchable canonical pool history.
3. `/pools/new` — provider creates a 1-2 GEN credit pool.
4. `/pools/:poolId` — pool state, dependency enrollment, evidence review, credits, and withdrawal.
5. `/dependencies` — connected integrator's dependency profiles.
6. `/activity` — transaction and adjudication lifecycle.
7. `/settings` — wallet, network, and display preferences.
8. `/help` — evidence model, state semantics, limits, and recovery guidance.

## Anti-default rules

- No AI-purple gradients, centered hero on dark mesh, Inter/slate default, bento collage, glassmorphism, fake live data, animated metric counters, or generic AI brain/network imagery.
- No headline eyebrow above every section, no sentence fragments split into decorative zigzags, and no more than one primary CTA per decision area.
- Copy names the actor, bounded evidence, finalized outcome, and limitation. Avoid "revolutionary", "seamless", "next-generation", and unsupported trust claims.

## Preflight

- [ ] Contrast and keyboard focus pass.
- [ ] Exactly one primary CTA in each decision area.
- [ ] Theme, accent, and radius locks hold across all pages.
- [ ] Hero copy and illustration fit at 375 and 1440 px.
- [ ] Navigation stays reachable; fixed UI hides no content.
- [ ] Every state has loading, empty, failure, retry, and honest-unconfigured handling where applicable.
- [ ] Wallet modal lists detected providers and supports explicit disconnect.
- [ ] No fake balances, fees, gas, signatures, finality, transaction hashes, or contract state.
- [ ] All visible product copy is English and contains no internal implementation notes.
- [ ] Reduced motion, screen-reader announcements, and responsive table alternatives are verified.
