import { OpenElementThemeManager } from './open-element-theme.ts';

/**
 * Owns the global style registry and host theme propagation.
 *
 * Extracted from the base class (#904, concern: StyleSheet management).
 * The single themeManager instance serves every OpenElement host; the base
 * class only forwards the public statics to it.
 */
export const themeManager = new OpenElementThemeManager();
