import {
  consumeAttachmentScans,
  type QueueBatch,
  reconcileAttachments,
  type WorkerEnv,
} from './cloudflare-lifecycle.ts';

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface NitroHandler {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> | Response;
}

export function createCloudflareHandlers(
  nitro: NitroHandler,
  lifecycle = { reconcileAttachments, consumeAttachmentScans },
) {
  return {
    fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
      return nitro.fetch(request, env, ctx);
    },
    scheduled(_event: unknown, env: WorkerEnv, ctx: ExecutionContext) {
      ctx.waitUntil(lifecycle.reconcileAttachments(env));
    },
    queue(
      batch: QueueBatch<import('./cloudflare-lifecycle.ts').AttachmentScanMessage>,
      env: WorkerEnv,
    ) {
      return lifecycle.consumeAttachmentScans(batch, env);
    },
  };
}
