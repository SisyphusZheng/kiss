/** Compatible with console.error and the tagged Logger from createLogger(). */
export type ActionErrorLogger = (msg: string, ...args: unknown[]) => void;

/**
 * Convert an action exception into stable render data and environment-safe
 * diagnostics. Callers pass their own tagged logger (e.g. the spa logger) so
 * the messages carry the caller's tag instead of a hardcoded prefix.
 */
export function normalizeActionFailure(
  error: unknown,
  development: boolean,
  log: ActionErrorLogger = console.error,
): { error: 'Action failed' } {
  if (development) log('action failed:', error);
  else log('action failed');
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
  if (development) log('loader failed:', error);
  else log('loader failed');
  return { error: 'Loader failed' };
}
