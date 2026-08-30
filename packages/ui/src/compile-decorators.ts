/**
 * Runtime no-op stand-ins for the compile-time-only @element/@property
 * decorators (ADR-0143).
 *
 * The OpenElement compiler (the @openelement/adapter-vite open:compiled-element
 * transform) rewrites every module that applies them; the decorators never
 * run in compiled output. Unlike the app-level ambient `declare` pattern,
 * @openelement/ui sources are also imported WITHOUT the compiler (Deno unit
 * tests, www/vite.config.ts evaluation), so these are real no-op functions:
 * module evaluation and class definition stay safe, and an uncompiled class
 * still fails closed at connect time (OE_PROGRAM_MISSING).
 */

/** Compile-time decorator marker; no-op at runtime. */
export function element(
  _tag: string,
  _options?: {
    root?: 'light' | 'shadow-open' | 'shadow-closed';
    delegatesFocus?: boolean;
    formAssociated?: boolean;
  },
): (target: unknown, context?: unknown) => void {
  // Liberal call signature: accepted by both the legacy (experimental) and
  // the standard (TC39) decorator typings consumers may typecheck under.
  return () => undefined;
}

/** Compile-time decorator marker; no-op at runtime. */
export function property(_options: {
  reflect: boolean;
  attribute?: false | string;
  type?: unknown;
  converter?: unknown;
}): (target: unknown, context?: unknown) => void {
  return () => undefined;
}
