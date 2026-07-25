/** Host-agnostic route and asset contracts shared by app and build drivers. */
export type OpenElementRouteKind = 'page' | 'api';

export interface OpenElementRouteNode {
  kind: OpenElementRouteKind;
  path: string;
  filePath?: string;
  importPath?: string;
  tagName?: string;
  paramNames?: string[];
  children?: OpenElementRouteNode[];
  meta?: Record<string, unknown>;
}
