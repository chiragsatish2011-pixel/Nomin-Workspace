# Nomin Design System — Kraken theme

The live source of truth is `app/globals.css`. This document explains the
intent; the CSS is what ships. Every token below exists as a Tailwind v4
`@theme` variable, so changing a value here re-skins the whole app.

## 1. Atmosphere

White surfaces, cool blue-grey neutrals, hairline borders, whisper-level
shadows. Kraken Purple is the one commanding accent — it owns every call to
action, link, focus ring and active state, and nothing else competes with it.

## 2. Color

### Brand — the only purples in the system

| Token | Value | Role |
|---|---|---|
| `--color-brand` | `#7132f5` | Primary CTA, links, focus, active nav |
| `--color-brand-dark` | `#5741d8` | Hover, outlined-button border/text |
| `--color-brand-deep` | `#5b1ecf` | Deepest purple, gradients |
| `--color-brand-subtle` | `rgba(133,91,251,0.16)` | Subtle button + badge fill |

### Ink & neutrals

`--color-ink` `#101114` · `--color-charcoal` `#22242c` ·
`--color-slate` `#484b5e` · `--color-steel` `#686b82` ·
`--color-stone` `#9497a9` · `--color-muted` `#b2b4c1` ·
`--color-canvas` `#ffffff` · `--color-fog` `#f7f7fa` ·
`--color-mist` `#f1f1f5` · `--color-hairline` `#dedee5` ·
`--color-hairline-soft` `#e9e9f0`

### Deep brand bands

`--color-royal` `#4a1bb0` · `--color-royal-deep` `#2a0f66` ·
`--color-indigo` `#1a0b3d` — the auth panel, the console mock, dark feature
strips. Use these, never `bg-ink`, when a surface must genuinely be dark:
`bg-ink` follows the workspace accent and is a primary-action surface.

### Section identity (never for generic buttons or text)

Checkpoints `#149e61` · Files `#2f6bf0` · Projects `#e0523c` ·
Chat `#7132f5` · Calls `#149e61` (parked).

### Semantic

Success `#149e61` on `rgba(20,158,97,0.16)`, text `#026b3f` ·
Error `#d92d20` on `#fef3f2` · Focus `#7132f5`.

## 3. Type

Kraken-Brand and Kraken-Product are proprietary. IBM Plex Sans is their
documented fallback, so one family carries both roles, loaded through
`next/font` in `app/layout.tsx`.

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Display hero | 48px | 700 | -1px |
| Section heading | 36px | 700 | -0.5px |
| Sub-heading | 28px | 700 | -0.5px |
| Feature title | 22px | 600 | normal |
| Body | 16px | 400 | normal |
| Button | 16px | 500–600 | normal |
| Caption | 14px | 400–700 | normal |
| Small | 12px | 400–500 | normal |

`.font-display` carries `letter-spacing: -0.02em` from `@layer base`, so any
explicit `tracking-*` utility on the element still wins.

## 4. Radius

Scale: 3 · 6 · 8 · 10 · 12 · 16px, exposed as `--radius-xs … --radius-2xl`.
`--radius-3xl` and `--radius-4xl` are clamped to 16px so no card can exceed
the ceiling.

**12px is the maximum for anything clickable — no pill buttons.** A CSS rule
in `globals.css` enforces this by rewriting `rounded-full` on `button`, `a`,
`summary` and `[role="button"]`. Controls that must genuinely stay round
(toggle-switch tracks) opt out with the `is-circular` class. Circular shapes
that are not controls — avatars, status dots, spinners, progress rings — are
spans and divs, and are untouched.

## 5. Elevation

`--shadow-subtle` `0 4px 24px rgba(0,0,0,0.03)` (Tailwind: `shadow-subtle`)
and `--shadow-micro` `0 1px 4px rgba(16,24,40,0.04)`. Nothing heavier.

## 6. Button recipes

`.btn` plus one of `.btn-primary`, `.btn-outline`, `.btn-subtle`,
`.btn-white`, `.btn-secondary`. All 12px radius; primary is 13px 16px
padding, subtle is 8px.

Existing buttons in the app use the `bg-ink text-white` pattern instead.
`bg-ink` is remapped to `var(--workspace-accent)`, which defaults to Kraken
Purple, so those buttons are already correct — and a user-chosen accent
(Settings → Appearance → Personalize) retints them all at once.

## 7. Badges

`.badge-success` (6px radius), `.badge-neutral` and `.badge-brand` (8px).
`components/Badge.tsx` maps its tones onto these.

## 8. Dark mode

Class-based on `<html>`, flipping the same semantic tokens, with neutrals
kept blue-cool so both themes read as one family. Purple works on either
canvas, so unlike the old near-black accent it needs no light/dark flip —
`bg-ink text-white` keeps white text in both.

## 9. Motion

CSS only, no library: staggered entrances (150–200ms hovers, 300/350ms UI
transitions), scroll reveals, animated gradients, sheen sweeps, a marquee
band and pulsing status dots. Everything collapses under
`prefers-reduced-motion`.

## 10. Do / don't

**Do** use `#7132f5` for CTAs and links · keep buttons at 12px · use
`bg-indigo` / `bg-royal-deep` for genuinely dark surfaces · reach for the
semantic tokens rather than hex values.

**Don't** ship pill buttons · introduce purples outside the brand scale ·
use `bg-ink` for a surface that isn't a primary action · hardcode a hex
where a token exists.
