import type { PageMeta, PageRouteContext } from '../authoring.ts';

export interface PageHostData {
  data: unknown;
  actionData?: unknown;
  params: Record<string, string>;
  request?: Request;
  route: PageRouteContext;
  meta: PageMeta;
  error?: unknown;
}

export interface PageHostElement extends HTMLElement {
  data?: unknown;
  __openElementActionData?: unknown;
  __openElementParams?: Record<string, string>;
  __openElementRequest?: Request;
  __openElementRoute?: PageRouteContext;
  __openElementMeta?: PageMeta;
  __openElementError?: unknown;
}

/** The single adapter for writing definePage render context onto a page host. */
export function applyPageHostData(host: PageHostElement, value: PageHostData): void {
  host.data = value.data;
  host.__openElementActionData = value.actionData;
  host.__openElementParams = value.params;
  host.__openElementRequest = value.request;
  host.__openElementRoute = value.route;
  host.__openElementMeta = value.meta;
  host.__openElementError = value.error;
}
