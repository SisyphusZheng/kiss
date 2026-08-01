export type ActionErrorLogger = (...args: unknown[]) => void;

/** Convert an action exception into stable render data and environment-safe diagnostics. */
export function normalizeActionFailure(
  error: unknown,
  development: boolean,
  log: ActionErrorLogger = console.error,
): { error: 'Action failed' } {
  if (development) log('[spa] action failed:', error);
  else log('[spa] action failed');
  return { error: 'Action failed' };
}

/**
 * Convert a loader exception into a stable page error and environment-safe
 * diagnostics (#676). The shape rides the page error channel
 * (`__openElementError`), never the loader data channel.
 */
export function normalizeLoaderFailure(
  error: unknown,
  development: boolean,
  log: ActionErrorLogger = console.error,
): { error: 'Loader failed' } {
  if (development) log('[spa] loader failed:', error);
  else log('[spa] loader failed');
  return { error: 'Loader failed' };
}
