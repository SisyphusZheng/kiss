/**
 * Runtime shim for @kissjs/core
 *
 * Route components import from '@kissjs/core' for unified DX.
 * At build time, Vite resolves '@kissjs/core' to this shim
 * (via resolve.alias), which only re-exports runtime APIs.
 * This prevents pulling in build-time code (node:fs, Vite plugins, etc.)
 * that would break the client/SSR bundle.
 *
 * This file is a build-time bridge — not part of the framework's public API.
 * Users should still write: import { LitElement, html, css } from '@kissjs/core'
 */
export { LitElement, html, css, nothing, svg } from 'lit'
export { unsafeHTML } from 'lit/directives/unsafe-html.js'
export { classMap } from 'lit/directives/class-map.js'
export { styleMap } from 'lit/directives/style-map.js'
export { ref, createRef } from 'lit/directives/ref.js'
export { Hono } from 'hono'
