/**
 * Type-only compatibility seam. Canonical shared definitions live in
 * @openelement/element. This is the single protocol seam for adapter-vite:
 * the former manifest.ts / render.ts shells were folded in here (alpha.10
 * #697) — framework, manifest, and render contracts are all semantic aliases
 * of the same @openelement/element type surface.
 */
export type * from '@openelement/element';
