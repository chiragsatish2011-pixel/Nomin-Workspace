# Nomin Workspace — Assets & Logo

## Current logo files

| File | Used by | Notes |
|---|---|---|
| `public/nomin-mark.svg` | `components/Wordmark.tsx`, metadata icons, `app/icon.svg` | Transparent SVG recreation of the chameleon mark (violet → teal → sky gradient). Dark-on-white safe. |
| `public/logo.svg` | Fallback copy of the mark | Same bytes as `nomin-mark.svg`. |
| `app/icon.svg` | Browser favicon (Next.js App Router) | Same mark. |
| `public/logo.png` | Unused (legacy path) | Still the old reference PNG — replace or delete. |
| `public/backgrounds/nomin-hero-bg.jpg` | `AuthLayout` brand panel | Copy of the reference hero art with a Kraken-purple overlay. Swap with your own 1600px+ art anytime. |

## Using the exact PNG logo you were given

The mark above is an SVG approximation. To use your exact provided logo:

1. Save it as `public/logo.png` (overwrite the legacy file).
2. In `components/Wordmark.tsx`, change `src="/nomin-mark.svg"` to
   `src="/logo.png"` and set `dims` to match your PNG aspect, e.g.
   `{ w: 224, h: 199 }` for the ~1.124 reference aspect.
3. Optional: generate favicons from the PNG and drop them at
   `app/icon.png` (Next.js picks it up automatically).

## Design system

`DESIGN-kraken.md` is the source of truth: white canvas, Kraken Purple
`#7132f5` (dark `#5741d8`, deep `#5b1ecf`), 12px button radius (never
pills), whisper shadows, green `#149e61` success. Tokens live in
`app/globals.css` (`--color-kraken*`); shared button styles are the
`.btn*` classes in the same file.
