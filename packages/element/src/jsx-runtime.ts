/// <reference path="./internal/core/jsx-types.d.ts" />

/**
 * Supported JSX transform entrypoint for Element authors.
 *
 * The JSX namespace consumed by TypeScript's automatic JSX transform is
 * declared once in internal/core/jsx-types.d.ts (shared with
 * jsx-dev-runtime.ts and the internal runtime) — do not re-declare it here.
 */
export { Fragment, jsx, jsxs } from './internal/core/jsx-runtime.ts';
