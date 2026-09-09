# TakeCare — brand assets (logo direction A: "Pulse through the pill")

Approved mark: a heartbeat stroke running through a tilted pill silhouette. The pill is a soft
ghost (low-opacity fill) so the icon reads as a single stroke at 48×48. Lima green is the only
brand colour; ink is lima 950.

## Files

| File | Use |
|---|---|
| `takecare-mark.svg` | Mark only, 48×48 viewBox, lima ghost + lima-950 stroke. In-app headers. |
| `takecare-mark-currentcolor.svg` | Same geometry, inherits `currentColor`. Use inside buttons/nav. |
| `takecare-icon.svg` | Rounded-square app icon, lima 400 background. |
| `takecare-icon-dark.svg` | Dark variant (lima 950 bg, lima 400 stroke). |
| `takecare-icon-maskable.svg` | Full-bleed, mark scaled to the 80% safe zone — Android maskable. |
| `takecare-wordmark.svg` / `-dark.svg` | Splash + login only. Poppins Bold, −1px tracking. |
| `png/icon-48/192/512.png`, `png/icon-maskable-512.png`, `png/apple-touch-icon-180.png` | Rasterised for the PWA manifest / iOS home screen. |

Geometry, if you ever need to redraw it (48×48 viewBox):
- pill: `<rect x="7" y="18" width="34" height="16" rx="8" transform="rotate(-38 24 26)">`, opacity .13–.22
- pulse: `M6 24h7.5l4-9.5L24 32l4-9h10`, stroke-width 3.6, round cap + join

Rules: never recolour the stroke outside {lima 950, lima 400, currentColor}; never put the mark on
a mid-tone lima (500/600) — contrast dies; minimum size 24px; clear space = 25% of the mark's width.

## Wiring it into the app (Vite + React + TS, vite-plugin-pwa injectManifest)

Copy `brand/*.svg` to `src/assets/brand/` and `brand/png/*` to `public/icons/`, then:

```ts
// vite.config.ts — manifest section of VitePWA({ strategies: 'injectManifest', ... })
manifest: {
  name: 'TakeCare',
  short_name: 'TakeCare',
  description: "Dad's medicines, tracked together.",
  start_url: '/',
  display: 'standalone',
  background_color: '#FBFCF7',
  theme_color: '#B4F526',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}
```

```html
<!-- index.html -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
<meta name="theme-color" content="#B4F526" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#12160E" media="(prefers-color-scheme: dark)" />
```

`TakeCareLogo.tsx` in this folder is a drop-in inline component (no asset request, themeable via
`currentColor`) — prefer it over an `<img>` for anything inside the app shell.

## Design tokens

`tokens.css` holds the full token set used by the mockups (light + dark). Import it once in
`src/main.tsx` and consume the variables; do not re-derive colours per component.

Type: Poppins 400/500/600/700 only. Weight carries hierarchy, not colour.
Status is always icon + word + weight — colour is the third signal, never the only one.
Missed doses / low stock use the amber pair (`--tc-warn-*`), never red.
Tap targets: 48px minimum, primary "Mark as Taken" is 64px.
