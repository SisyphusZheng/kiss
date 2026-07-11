/**
 * ./index.ts - Reactive property declaration types.
 *
 * ADR-0052 / SOP-010 / ADR-0057: static props + Signal model.
 */

export type PropDeclShorthand =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor;

export type PropDeclFull =
  | { type: StringConstructor; default?: string; reflect?: boolean }
  | { type: NumberConstructor; default?: number; reflect?: boolean }
  | { type: BooleanConstructor; default?: boolean; reflect?: boolean }
  | { type: ArrayConstructor; default?: unknown[]; reflect?: boolean }
  | { type: ObjectConstructor; default?: Record<string, unknown>; reflect?: boolean };

export type PropDecl = PropDeclShorthand | PropDeclFull;

export type PropType<D> = D extends NumberConstructor ? number
  : D extends StringConstructor ? string
  : D extends BooleanConstructor ? boolean
  : D extends ArrayConstructor ? unknown[]
  : D extends ObjectConstructor ? Record<string, unknown>
  : D extends { type: NumberConstructor } ? number
  : D extends { type: StringConstructor } ? string
  : D extends { type: BooleanConstructor } ? boolean
  : D extends { type: ArrayConstructor } ? unknown[]
  : D extends { type: ObjectConstructor } ? Record<string, unknown>
  : unknown;

export type PropsFrom<P extends Record<string, PropDecl>> = {
  [K in keyof P]: PropType<P[K]>;
};

export interface NormalizedPropDecl {
  type: StringConstructor | NumberConstructor | BooleanConstructor;
  default: unknown;
  reflect: boolean;
}
