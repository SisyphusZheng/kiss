import type { RenderError } from '../protocol/render.ts';
import { OpenElementError } from './errors.ts';

export const MAX_SSR_NESTING_DEPTH = 50;
export const RENDER_PATH_TRACK_MIN_DEPTH = MAX_SSR_NESTING_DEPTH - 12;
const RENDER_PATH_WINDOW = 16;

export function appendRenderPathSegment(path: readonly string[], segment: string): string[] {
  if (path.length < RENDER_PATH_WINDOW) return [...path, segment];
  return ['…', ...path.slice(-(RENDER_PATH_WINDOW - 2)), segment];
}

export function formatDepthPathSuffix(
  path: readonly string[] | undefined,
  tagName: string,
): string {
  if (!path || path.length === 0) return '';
  const segments = path[path.length - 1] === tagName ? path : [...path, tagName];
  return ` (path: ${segments.join(' > ')})`;
}

export function isControlFlowThrow(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const name = (err as { name?: unknown }).name;
  if (name === 'OpenElementNotFound') return (err as { status?: unknown }).status === 404;
  if (name === 'OpenElementRedirect') {
    const status = (err as { status?: unknown }).status;
    return typeof status === 'number' && status >= 300 && status < 400;
  }
  return false;
}

export function isDepthLimitError(err: unknown): boolean {
  return err instanceof OpenElementError && err.code === 'SSR_NESTING_DEPTH_EXCEEDED';
}

export class BoundaryRenderError extends Error {
  constructor(public readonly renderError: RenderError) {
    super(renderError.message);
    this.name = 'BoundaryRenderError';
  }
}
