# Migration Guide: Web Standards Lab

## Goal

Move `www` away from the old dark external-brand direction and into the Web
Standards Lab direction.

## Required Changes

1. Default to light-first theme.
2. Use dark panels only for code, route, package, terminal, and artifact views.
3. Replace external brand mimicry with product artifacts.
4. Remove stale Hub and old package-count language from core entry pages.
5. Keep homepage section helpers out of route-scanned directories.
6. Align docs landing, roadmap, architecture, and design system pages.
7. Update design tokens and QA checklist before generating new mockups.

## Implementation Notes

- `www/public/theme-init.js` owns early theme selection.
- `www/vite.config.ts` injects site-level tokens.
- `packages/ui/src/open-layout.tsx` owns shared shell, header, sidebar, footer.
- `www/app/components/page-styles.ts` owns prose pages.
- `www/app/routes/index/index.tsx` owns homepage composition.
- `www/app/routes/docs/index.tsx`, `roadmap.tsx`, and
  `architecture/design-system.tsx` must stay aligned with product truth.

## Legacy Assets

Existing mockup SVG/PNG files were generated for the previous direction. Treat
them as historical snapshots until a new generator creates Web Standards Lab
mockups.
