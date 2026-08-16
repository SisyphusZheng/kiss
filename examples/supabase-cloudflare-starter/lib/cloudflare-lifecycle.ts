export interface AttachmentScanMessage {
  type: 'attachment.scan';
  reservationId: string;
  objectKey: string;
}

export interface QueueMessage<T> {
  body: T;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

export interface QueueBatch<T> {
  queue: string;
  messages: QueueMessage<T>[];
}

export interface WorkerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ATTACHMENT_SCANNER: { fetch(request: Request): Promise<Response> };
  ATTACHMENT_SCAN_QUEUE: { send(message: AttachmentScanMessage): Promise<void> };
}

const BUCKET = 'notes-attachments';

function headers(env: WorkerEnv): HeadersInit {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'content-type': 'application/json',
  };
}

async function rpc<T>(env: WorkerEnv, name: string, body: unknown): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${name} failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function consumeAttachmentScans(
  batch: QueueBatch<AttachmentScanMessage>,
  env: WorkerEnv,
): Promise<void> {
  for (const message of batch.messages) {
    if (message.body?.type !== 'attachment.scan') {
      message.ack();
      continue;
    }
    try {
      const response = await env.ATTACHMENT_SCANNER.fetch(
        new Request('https://scanner/scan', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(message.body),
        }),
      );
      if (!response.ok) throw new Error(`scanner failed (${response.status})`);
      const result = await response.json() as { verdict?: string };
      if (result.verdict !== 'clean' && result.verdict !== 'quarantined') {
        throw new Error('scanner returned an invalid verdict');
      }
      await rpc(env, 'complete_attachment_scan', {
        reservation_id: message.body.reservationId,
        target_key: message.body.objectKey,
        verdict: result.verdict,
      });
      message.ack();
    } catch {
      message.retry();
    }
  }
}

export async function consumeAttachmentScanDeadLetters(
  batch: QueueBatch<AttachmentScanMessage>,
  env: WorkerEnv,
): Promise<void> {
  for (const message of batch.messages) {
    if (message.body?.type !== 'attachment.scan') {
      message.ack();
      continue;
    }
    try {
      await rpc(env, 'record_attachment_scan_dead_letter', {
        reservation_id: message.body.reservationId,
        target_key: message.body.objectKey,
      });
      message.ack();
    } catch {
      message.retry();
    }
  }
}

export async function reconcileAttachments(env: WorkerEnv): Promise<void> {
  const stale = await rpc<{ id: string; object_key: string }[]>(
    env,
    'list_stale_attachment_reservations',
    {},
  );
  for (const reservation of stale) {
    try {
      const removed = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        headers: headers(env),
        body: JSON.stringify({ prefixes: [reservation.object_key] }),
      });
      if (!removed.ok) continue;
      await rpc(env, 'release_stale_attachment', { reservation_id: reservation.id });
    } catch {
      // One corrupt/transient object must not starve the rest of the Cron page.
    }
  }

  const pending = await rpc<{ id: string; object_key: string }[]>(
    env,
    'list_pending_attachment_scans',
    {},
  );
  for (const reservation of pending) {
    try {
      await env.ATTACHMENT_SCAN_QUEUE.send({
        type: 'attachment.scan',
        reservationId: reservation.id,
        objectKey: reservation.object_key,
      });
    } catch {
      // Continue the page; the failed row remains pending for the next run.
    }
  }

  const replays = await rpc<{ id: string; reservation_id: string; object_key: string }[]>(
    env,
    'list_requested_attachment_scan_replays',
    {},
  );
  for (const replay of replays) {
    try {
      await env.ATTACHMENT_SCAN_QUEUE.send({
        type: 'attachment.scan',
        reservationId: replay.reservation_id,
        objectKey: replay.object_key,
      });
      await rpc(env, 'mark_attachment_scan_replayed', { dead_letter_id: replay.id });
    } catch {
      // Keep replay_requested durable; the next Cron run retries the handoff.
    }
  }
}
