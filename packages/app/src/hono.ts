/**
 * Hono driver bridge for the OpenElement application model.
 *
 * Hono remains the official default request driver, but request information is
 * normalized into OpenElement RequestContext before framework code observes it.
 */

import { createRequestContext } from './model.ts';
import type {
  CreateRequestContextOptions,
  OpenElementRequestContext,
  OpenElementRouteNode,
} from './model.ts';

export interface HonoRequestLike {
  raw?: Request;
  param?: () => Record<string, string>;
}

export interface HonoContextLike<Env extends Record<string, unknown> = Record<string, unknown>> {
  req?: HonoRequestLike;
  env?: Env;
  executionCtx?: unknown;
}

export interface CreateHonoRequestContextOptions<
  Env extends Record<string, unknown> = Record<string, unknown>,
> {
  context: HonoContextLike<Env>;
  request?: Request;
  route?: OpenElementRouteNode;
  env?: Env;
  platform?: unknown;
}

export function createHonoRequestContext<
  Env extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateHonoRequestContextOptions<Env>,
): OpenElementRequestContext<Env> {
  const request = options.request ?? options.context.req?.raw;
  if (!request) {
    throw new Error('Hono driver requires a Web Request from context.req.raw or options.request');
  }

  const contextOptions: CreateRequestContextOptions<Env> = {
    request,
    params: options.context.req?.param?.() ?? {},
    env: options.env ?? options.context.env,
    platform: options.platform ?? options.context.executionCtx,
    route: options.route,
  };
  return createRequestContext(contextOptions);
}
