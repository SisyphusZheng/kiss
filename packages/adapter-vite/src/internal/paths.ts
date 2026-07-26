/**
 * Shared output-path constants for the adapter build pipeline.
 *
 * 'dist' and '.openElement' were previously repeated as magic strings across
 * the pipeline (Q-F1); route every default through these two names.
 */

/** Default build output directory name (relative to the app root). */
export const DEFAULT_OUT_DIR = 'dist';

/** openElement metadata directory name (route types, build artifacts). */
export const OPEN_ELEMENT_DIR = '.openElement';
