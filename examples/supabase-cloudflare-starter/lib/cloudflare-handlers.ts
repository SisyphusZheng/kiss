import {
  consumeAttachmentScanDeadLetters,
  consumeAttachmentScans,
  type QueueBatch,
  reconcileAttachments,
  type WorkerEnv,
} from './cloudflare-lifecycle.ts';
import { ATTACHMENT_SCAN_DLQ_NAME, ATTACHMENT_SCAN_QUEUE_NAME } from './cloudflare-queues.ts';

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface NitroHandler {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> | Response;
}

export function createCloudflareHandlers(
  nitro: NitroHandler,
  lifecycle = { reconcileAttachments, consumeAttachmentScans, consumeAttachmentScanDeadLetters },
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
      if (batch.queue === ATTACHMENT_SCAN_QUEUE_NAME) {
        return lifecycle.consumeAttachmentScans(batch, env);
      }
      if (batch.queue === ATTACHMENT_SCAN_DLQ_NAME) {
        return lifecycle.consumeAttachmentScanDeadLetters(batch, env);
      }
      throw new Error(`unexpected attachment queue: ${batch.queue}`);
    },
  };
}
