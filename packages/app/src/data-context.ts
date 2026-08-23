/** Public render-scoped loader/action data hooks. */
import {
  __activeDataContext,
  currentActionData,
  currentLoaderData,
} from './internal/router/data-context-store.ts';

export function useLoaderData<T = unknown>(): T | undefined {
  return currentLoaderData(__activeDataContext()) as T | undefined;
}

export function useActionData<T = unknown>(): T | undefined {
  return currentActionData(__activeDataContext()) as T | undefined;
}
