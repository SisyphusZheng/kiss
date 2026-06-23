/**
 * @openelement/element — Public types.
 */

import type { VNode } from '@openelement/protocol/vnode';
import type { StyleSheetLike } from '@openelement/protocol/style-sheet';

export interface ElementDefinition<
  Props extends Record<string, unknown> = Record<string, unknown>,
> {
  styles?: StyleSheetLike | StyleSheetLike[];
  render: (props: Props) => VNode | null;
}
