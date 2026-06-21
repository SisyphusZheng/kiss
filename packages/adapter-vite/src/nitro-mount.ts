import type { OpenElementRequestHandler, RuntimeContext } from '@openelement/core/runtime';

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
    const response = await options.handler(request, context);

    return {
      status: response.status,
      headers: response.headers,
      body: response.body,
      response,
    };
  };
}
