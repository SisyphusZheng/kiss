/**
 * @openelement/element — Public types.
 */

import type { VNode } from './internal/protocol/vnode.ts';
import type { StyleSheetLike } from './internal/protocol/style-sheet.ts';

export interface ElementDefinition<
  Props extends Record<string, unknown> = Record<string, unknown>,
> {
  styles?: StyleSheetLike | StyleSheetLike[];
  render: (props: Props) => VNode | null;
}
