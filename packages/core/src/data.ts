/**
 * Platform-neutral data adapter protocol.
 *
 * Data adapters are contract surfaces for route data and ISR regeneration.
 * Concrete databases, filesystems, network clients, and auth layers stay in
 * adapters or recipes.
 */

import type {
  Action,
  ActionContext,
  DataAdapter,
  Loader,
  LoaderContext,
} from '@openelement/protocol/data';
export type { Action, ActionContext, DataAdapter, Loader, LoaderContext };
