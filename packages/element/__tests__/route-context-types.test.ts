import { assertEquals } from '@std/assert';
import type {
  ActionContext,
  LoaderContext,
  ServerRouteContext,
  SpaActionContext,
  SpaLoaderContext,
} from '../src/internal/protocol/data.ts';

interface WorkerEnv {
  QUEUE: { send(value: unknown): Promise<void> };
  KV: { get(key: string): Promise<string | null> };
  RATE_LIMITER: { limit(input: { key: string }): Promise<{ success: boolean }> };
  SERVICE: { fetch(request: Request): Promise<Response> };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

type RouteContext = LoaderContext<WorkerEnv, ExecutionContext>;
type ExpectedKeys = 'request' | 'params' | 'env' | 'platform' | 'responseHeaders' | 'route';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;
const _serverFieldsAreExact: Equal<keyof RouteContext, ExpectedKeys> = true;

function compileOnlyFixtures(): void {
  const server = null as unknown as RouteContext;
  server.env.QUEUE.send({ id: 1 });
  server.env.KV.get('key');
  server.responseHeaders.set('cache-control', 'private');

  const action = null as unknown as ActionContext<WorkerEnv, ExecutionContext>;
  const _loaderFromAction: ServerRouteContext<WorkerEnv, ExecutionContext> = action;
  action.formData.get('intent');
  void _loaderFromAction;

  const spaLoader = null as unknown as SpaLoaderContext;
  const spaAction = null as unknown as SpaActionContext;
  spaLoader.params.id;
  spaAction.formData?.get('intent');
  // @ts-expect-error SPA contexts deliberately have no server Request.
  spaLoader.request;
  // @ts-expect-error SPA contexts deliberately have no response header channel.
  spaAction.responseHeaders;
}
void compileOnlyFixtures;

Deno.test('server and SPA route context compile-time fixtures (#615, #1110)', () => {
  assertEquals(_serverFieldsAreExact, true);
});
