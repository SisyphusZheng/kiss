/**
 * @openelement/app/vite — Canonical Vite plugin entry for openElement framework users.
 *
 * Re-exports from @openelement/adapter-vite so consumers can use the unified
 * framework facade: `import { openElement } from '@openelement/app/vite'`.
 *
 * @openelement/adapter-vite remains the implementation module.
 */
export { openElement, type OpenElementOptions } from '@openelement/adapter-vite';
