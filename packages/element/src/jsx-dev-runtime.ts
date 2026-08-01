/// <reference path="./internal/core/jsx-types.d.ts" />

/**
 * Supported development JSX transform entrypoint for Element authors.
 *
 * The JSX namespace consumed by TypeScript's automatic development transform
 * is declared once in internal/core/jsx-types.d.ts (shared with
 * jsx-runtime.ts and the internal runtime) — do not re-declare it here.
 */
export { Fragment, jsxDEV } from './internal/core/jsx-runtime.ts';
