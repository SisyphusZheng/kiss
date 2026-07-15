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
