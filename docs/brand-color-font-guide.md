# approvU — Brand, Colour & Font Guide

Developer reference for the application's design system. All values are the source
of truth defined in `src/styles.css` (Tailwind v4, CSS-first config). Colours use
the `oklch()` colour space; hex values below are approximate conversions for
designers and external tooling.

---

## 1. How the design system works

- **Tailwind v4, CSS-first.** There is **no** `tailwind.config.js`. All tokens live
  in `src/styles.css`.
- **Two-layer token model:**
  1. `:root` / `.dark` define the raw colour values (e.g. `--primary: oklch(...)`).
  2. `@theme inline` maps each raw value to a Tailwind colour utility
     (e.g. `--color-primary: var(--primary)` → generates `bg-primary`,
     `text-primary`, `border-primary`, etc.).
- **Always use semantic tokens** in components (`bg-primary`, `text-muted-foreground`).
  Never hardcode raw colours (`#005467`, `text-white`, `bg-black`) in JSX.
- **Dark mode** is class-based (`.dark` on a parent). Class-based variant:
  `@custom-variant dark (&:is(.dark *))`.

---

## 2. Brand colours (the approvU palette)

These are the distinctive brand accents used across heroes, badges, and status states.

| Token | Tailwind classes | Light `oklch` | Approx hex | Role |
|---|---|---|---|---|
| `--primary` | `bg-primary` `text-primary` | `oklch(0.42 0.066 220)` | **#005467** | Teal-navy. Primary brand colour: headers, primary CTAs, active nav, hero backgrounds, focus emphasis |
| `--secondary` | `bg-secondary` `text-secondary` | `oklch(0.66 0.10 210)` | **#00A3B6** | Cyan. Info, progress bars, step badges, "under review" states |
| `--mint` | `bg-mint` `text-mint` | `oklch(0.74 0.12 190)` | **#2EC5BC** | Success / unlocked / completed / approved states |
| `--coral` / `--accent` | `bg-coral` `bg-accent` | `oklch(0.72 0.18 22)` | **#FE6A6A** | Warning, errors, required asterisks, destructive emphasis, "Remove" |
| `--yellow` | `bg-yellow` | `oklch(0.88 0.15 90)` | **#FED766** | Caution, "decision required", locked notices |
| `--light-teal` | `bg-light-teal` | `oklch(0.78 0.10 210)` | **#50C4D3** | Soft teal accent / secondary highlights |
| `--pink` | `bg-pink` | `oklch(0.72 0.13 12)` | **#EF798A** | Decorative / chart accent |
| `--light-yellow` | `bg-light-yellow` | `oklch(0.97 0.09 105)` | **#FBFD9A** | Soft highlight backgrounds |

> Each brand colour has a matching `*-foreground` token (e.g. `--mint-foreground`)
> for text/icons placed on top of it. Use `text-mint-foreground` on a `bg-mint` surface.

### Semantic role summary

- **Primary `#005467`** = brand identity / main action.
- **Secondary `#00A3B6`** = information & progress.
- **Mint `#2EC5BC`** = success / done / approved.
- **Coral `#FE6A6A`** = warning / error / destructive.
- **Yellow `#FED766`** = caution / decision-required.

---

## 3. UI / surface colours

Neutral tokens used for layout, text, and chrome. Both light (`:root`) and dark (`.dark`) values are listed.

| Token | Tailwind classes | Light | Dark | Role |
|---|---|---|---|---|
| `--background` | `bg-background` | `oklch(0.99 0.005 220)` (near-white) | `oklch(0.129 0.042 264.695)` (near-black) | App background, inputs |
| `--foreground` | `text-foreground` | `oklch(0.22 0.04 220)` (dark slate) | `oklch(0.984 0.003 247.858)` (near-white) | Primary text |
| `--card` | `bg-card` | `oklch(1 0 0)` (white) | `oklch(0.208 0.042 265.755)` | Cards, panels, headers |
| `--card-foreground` | `text-card-foreground` | dark slate | near-white | Text on cards |
| `--popover` / `--popover-foreground` | `bg-popover` | white / dark slate | dark / near-white | Popovers, dropdowns |
| `--muted` | `bg-muted` | `oklch(0.96 0.01 220)` (light gray) | `oklch(0.279 0.041 260.031)` | Subtle backgrounds, tracks, headers |
| `--muted-foreground` | `text-muted-foreground` | `oklch(0.5 0.03 220)` (mid gray) | `oklch(0.704 0.04 256.788)` | Hints, labels, placeholders |
| `--border` | `border-border` | `oklch(0.91 0.012 220)` | `oklch(1 0 0 / 10%)` | All borders |
| `--input` | `border-input` | `oklch(0.91 0.012 220)` | `oklch(1 0 0 / 15%)` | Input borders |
| `--ring` | `ring-ring` | `oklch(0.66 0.10 210)` (cyan) | `oklch(0.551 0.027 264.364)` | Focus rings |
| `--destructive` | `bg-destructive` | `oklch(0.577 0.245 27.325)` (red) | `oklch(0.704 0.191 22.216)` | Destructive actions |

### Chart palette

`--chart-1` … `--chart-5` (`text-chart-1`, etc.) provide a 5-colour categorical
sequence for data viz, distinct in both light and dark themes.

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `oklch(0.646 0.222 41.116)` | `oklch(0.488 0.243 264.376)` |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | `oklch(0.696 0.17 162.48)` |
| `--chart-3` | `oklch(0.398 0.07 227.392)` | `oklch(0.769 0.188 70.08)` |
| `--chart-4` | `oklch(0.828 0.189 84.429)` | `oklch(0.627 0.265 303.9)` |
| `--chart-5` | `oklch(0.769 0.188 70.08)` | `oklch(0.645 0.246 16.439)` |

### Sidebar palette

Dedicated tokens for the sidebar/internal shell: `--sidebar`, `--sidebar-foreground`,
`--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`,
`--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`
(Tailwind: `bg-sidebar`, `text-sidebar-foreground`, …).

---

## 4. Typography

- **Single font family.** The app uses one font for both headings and body:

  ```
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system,
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  ```

- **Primary typeface:** **Inter** (with a robust system-font fallback stack so the
  app stays legible if Inter fails to load).
- **Tailwind utility:** `font-sans` (mapped via `--font-sans` in `@theme inline`).
  Applied globally on `body` in the base layer.
- **Font smoothing:** antialiased (`-webkit-font-smoothing: antialiased`,
  `-moz-osx-font-smoothing: grayscale`).
- **Weights:** Inter Regular (400) for body, 500–600 for emphasis/labels,
  600–700 for headings (driven by Tailwind `font-medium` / `font-semibold` / `font-bold`).
- **Type scale:** Tailwind defaults (`text-sm`, `text-base`, `text-lg`, `text-xl`, …).

> There is no separate display/serif font. Keep all text on the Inter stack for brand consistency.

---

## 5. Radius & shape

| Token | Value | Tailwind |
|---|---|---|
| `--radius` (base) | `0.875rem` (14px) | — |
| `--radius-sm` | `radius − 4px` | `rounded-sm` |
| `--radius-md` | `radius − 2px` | `rounded-md` |
| `--radius-lg` | `radius` | `rounded-lg` |
| `--radius-xl` | `radius + 4px` | `rounded-xl` |
| `--radius-2xl` … `--radius-4xl` | `radius + 8/12/16px` | `rounded-2xl` … `rounded-4xl` |

Cards use `rounded-xl`; buttons use `rounded-md`.

---

## 6. Accessibility & motion

- **Focus rings (WCAG 2.2 AA):** all interactive elements get a visible
  `2px solid var(--ring)` outline with `2px` offset on `:focus-visible`.
- **Skip-to-content** link styled with `--primary` / `--primary-foreground`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` collapses all
  animations/transitions to ~0ms.
- **Print styles:** force white background / black text, hide nav/aside, flatten
  radii and shadows for shareable artifacts.

---

## 7. Usage rules for developers

1. **Only use semantic tokens** in components — never raw hex or `text-white`/`bg-black`.
2. **Add new colours in `src/styles.css`** in two places: a raw value in `:root`
   (and `.dark`), then register it under `@theme inline` as `--color-<name>`.
3. **Pair every background with its foreground** token for correct contrast in both themes.
4. **Test both light and dark** modes — brand accents keep their hue, but neutrals invert.
5. **Components reference tokens via Tailwind classes**, e.g.
   `className="bg-primary text-primary-foreground"`.

---

## Quick reference — brand hex chips

| Colour | Hex |
|---|---|
| Primary (teal-navy) | `#005467` |
| Secondary (cyan) | `#00A3B6` |
| Light teal | `#50C4D3` |
| Mint | `#2EC5BC` |
| Coral / accent | `#FE6A6A` |
| Pink | `#EF798A` |
| Yellow | `#FED766` |
| Light yellow | `#FBFD9A` |