# ResGuard — Shared Design Tokens

Single source of truth for the ResGuard visual language, shared by the two
independent repositories:

| Surface | Location | Consumer |
| --- | --- | --- |
| Raw tokens (CSS) | `residential-management-system/styles/design-tokens.css` | Web (Tailwind v4 bridge in `app/globals.css`) |
| Mirrored palette (TS) | `ResGuardMobile/src/lib/theme.ts` (`palette`) | Mobile (React Native Paper / MD3) |

The repositories have separate `.git` roots, so tokens are shared **by
specification** (this document + matching values), not by a package dependency.
Do **not** introduce a monorepo or a cross-repo package for this.

## Naming contract (web)

- `styles/design-tokens.css` defines **raw** variables without a `--color-`
  prefix (`--background`, `--card`, `--brand`, …). They switch on theme:
  `:root` = light, `.dark` = dark (class applied to `<html>` by `next-themes`).
- `app/globals.css` bridges them to Tailwind's `--color-*` namespace inside
  `@theme inline` (`--color-background: var(--background)`).

The two namespaces must stay distinct. Writing
`--color-background: var(--color-background)` self-references and breaks every
utility that depends on it.

## Color roles

| Role | Light | Dark | Notes |
| --- | --- | --- | --- |
| `background` | `#F5F7F8` | `#020617` | App canvas |
| `card` / surface | `#FFFFFF` | `#0F172A` | Panels, cards |
| `popover` / elevated | `#FFFFFF` | `#16203A` | Menus, popovers |
| `muted` / subtle | `#F1F5F9` | `#1E293B` | Chips, tracks, hover fills |
| `foreground` | `#0F172A` | `#F8FAFC` | Primary text |
| `foreground-secondary` | `#475569` | `#CBD5E1` | Body/secondary text (`text-subtle`) |
| `foreground-muted` | `#64748B` | `#94A3B8` | Captions (`muted-foreground`) |
| `primary` | `#0F172A` | `#F1F5F9` | Primary action / navy brand in light |
| `primary-foreground` | `#FFFFFF` | `#0F172A` | Text on primary |
| `brand` (teal) | `#159A8C` | `#2DD4BF` | Brand accent, active states, focus ring |
| `brand-soft` | `#D6F2EE` | `#0F3D38` | Brand-tinted container |
| `accent` (amber) | `#D97706` | `#FBBF24` | Secondary accent / warning |
| `border` | `#E2E8F0` | `#1E293B` | Dividers, outlines |
| `ring` | `#159A8C` | `#2DD4BF` | Focus ring |
| `success` | `#059669` | `#34D399` | + `-container` / `-on-container` |
| `warning` | `#D97706` | `#FBBF24` | + `-container` / `-on-container` |
| `destructive` | `#DC2626` | `#F87171` | + `-container` / `-on-container` |
| `info` | `#0284C7` | `#38BDF8` | + `-container` / `-on-container` |

Sidebar roles (`sidebar*`) mirror `card`/`muted`/`brand`.

## Scale

- **Radius**: base `--radius: 12px` → `sm` 8, `md` 10, `lg` 12, `xl` 16.
  Cards use `rounded-xl`.
- **Spacing**: 4px step (`--space-1..16`). Tailwind's default scale matches.
- **Typography**: `--text-*` reference tokens (`display`, `h1`–`h4`,
  `body-lg`, `body`, `body-sm`, `caption`, `overline`) bridged in `globals.css`.
  Screens may also use Tailwind's built-in sizes.
- **Elevation**: `elev1`/`elev2`/`elev3` (`--shadow-elev*`), light = slate-tinted,
  dark = pure black.

## Theming mechanism

- **Web**: `next-themes` (`attribute="class"`, `defaultTheme="system"`,
  `storageKey="resguard-theme"`) wrapped in `components/providers/app-providers.tsx`.
  `components/ui/theme-toggle.tsx` is the accessible light/system/dark switch.
  `next-themes` injects a blocking script, preventing theme flash; `app/layout.tsx`
  keeps `suppressHydrationWarning`.
- **Mobile**: `useColorScheme()` selects `lightTheme` / `darkTheme` in
  `app/_layout.tsx`, passed to `PaperProvider`. Requires
  `app.json → expo.userInterfaceStyle = "automatic"`.
  Screens read colors via `useTheme()` (Paper) or `palette` from `theme.ts`.

## Rules

1. Never hardcode hex values in components; use tokens/`palette`.
2. Both themes must be checked (contrast + focus states).
3. Add new semantic colors to the raw token file **and** the mobile `palette`,
   keeping this table in sync.
