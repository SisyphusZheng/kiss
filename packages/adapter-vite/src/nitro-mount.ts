import type { OpenElementRequestHandler, RuntimeContext } from '@openelement/core/runtime';
import type { OpenElementRequestContext } from '@openelement/app/model';

export interface NitroLikeRequestEvent<
  Env extends Record<string, unknown> = Record<string, unknown>,
> {
  request?: Request;
  method?: string;
  path?: string;
  url?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  env?: Env;
  platform?: unknown;
}

export interface NitroLikeResponse {
  status: number;
  headers: Headers;
  body: BodyInit | null;
  response: Response;
}

export interface OpenElementNitroMountOptions<
  Env extends Record<string, unknown> = Record<string, unknown>,
> {
  handler: OpenElementRequestHandler<Env>;
  baseUrl?: string;
  env?: Env;
  platform?: unknown;
  /**
   * Observes the normalized OpenElement request context before the application
   * handler runs. Route params are empty here unless a future driver supplies
   * them before dispatch.
   */
  onBeforeRequestContext?: (context: OpenElementRequestContext<Env>) => void | Promise<void>;
}

function toRequest(event: NitroLikeRequestEvent, baseUrl: string): Request {
  if (event.request) return event.request;

  const url = event.url ? new URL(event.url, baseUrl) : new URL(event.path || '/', baseUrl);

  return new Request(url, {
    method: event.method || 'GET',
    headers: event.headers,
    body: event.body,
  });
}

function createNitroRequestContext<Env extends Record<string, unknown>>(
  request: Request,
  context: RuntimeContext<Env>,
): OpenElementRequestContext<Env> {
  // Keep this runtime-local. Nitro node output imports this module directly, so
  // a value import from @openelement/app/model would leave an unresolved bare
  // package in generated server output. The type-only import above still pins
  // this shape to the app model contract.
  const url = new URL(request.url);

  return {
    request,
    url,
    path: url.pathname,
    method: request.method,
    params: {},
    searchParams: url.searchParams,
    env: context.env,
    platform: context.platform,
  };
}

export function createOpenElementNitroHandler<
  Env extends Record<string, unknown> = Record<string, unknown>,
>(
  options: OpenElementNitroMountOptions<Env>,
): (event: NitroLikeRequestEvent<Env>) => Promise<NitroLikeResponse> {
  const baseUrl = options.baseUrl || 'http://localhost';

  return async (event: NitroLikeRequestEvent<Env>): Promise<NitroLikeResponse> => {
    const request = toRequest(event, baseUrl);
    const context: RuntimeContext<Env> = {
      env: event.env || options.env,
      platform: event.platform || options.platform,
    };
    await options.onBeforeRequestContext?.(
      createNitroRequestContext(request, context),
    );
    const response = await options.handler(request, context);

    return {
      status: response.status,
      headers: response.headers,
      body: response.body,
      response,
    };
  };
}
