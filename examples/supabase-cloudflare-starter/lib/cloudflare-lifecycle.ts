export interface AttachmentScanMessage {
  type: 'attachment.scan';
  reservationId: string;
  objectKey: string;
}

export interface PaymentEventMessage {
  type: 'payment.process';
  eventId: string;
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
  PAYMENT_EVENT_QUEUE: { send(message: PaymentEventMessage): Promise<void> };
}

const BUCKET = 'notes-attachments';

// Minimal structured payment logs. The correlation key is always the provider
// event id; payloads, object keys, customer data, and secrets are never logged.
function logPayment(level: 'info' | 'error', fields: Record<string, unknown>): void {
  const line = JSON.stringify(fields);
  if (level === 'error') console.error(line);
  else console.log(line);
}

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

export async function consumePaymentEvents(
  batch: QueueBatch<PaymentEventMessage>,
  env: WorkerEnv,
): Promise<void> {
  for (const message of batch.messages) {
    if (message.body?.type !== 'payment.process' || !message.body.eventId?.startsWith('evt_')) {
      message.ack();
      continue;
    }
    try {
      await rpc(env, 'process_stripe_event', { target_event_id: message.body.eventId });
      logPayment('info', {
        event: 'payment_event_processed',
        provider_event_id: message.body.eventId,
      });
      message.ack();
    } catch {
      logPayment('error', {
        event: 'payment_event_process_failed',
        provider_event_id: message.body.eventId,
      });
      message.retry();
    }
  }
}

export async function consumePaymentEventDeadLetters(
  batch: QueueBatch<PaymentEventMessage>,
  env: WorkerEnv,
): Promise<void> {
  for (const message of batch.messages) {
    if (message.body?.type !== 'payment.process' || !message.body.eventId?.startsWith('evt_')) {
      message.ack();
      continue;
    }
    try {
      await rpc(env, 'record_payment_event_dead_letter', {
        target_event_id: message.body.eventId,
      });
      logPayment('info', {
        event: 'payment_event_dead_letter_recorded',
        provider_event_id: message.body.eventId,
      });
      message.ack();
    } catch {
      logPayment('error', {
        event: 'payment_event_dead_letter_failed',
        provider_event_id: message.body.eventId,
      });
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

  const replays = await rpc<
    { id: string; reservation_id: string; object_key: string; replay_requested_by: string | null }[]
  >(
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
      // admin_audit handoff row (#998): the actor is the admin who requested
      // the replay, threaded through replay_requested_by. Rows requested
      // before that column existed carry no actor and are skipped; a
      // post-mark audit failure is swallowed below rather than double-
      // enqueueing a handoff that already landed.
      if (replay.replay_requested_by) {
        await rpc(env, 'log_admin_audit', {
          actor: replay.replay_requested_by,
          action: 'attachment_scan_replay_enqueued',
          target_type: 'attachment_scan_dead_letter',
          target_id: replay.id,
        });
      }
    } catch {
      // Keep replay_requested durable; the next Cron run retries the handoff.
    }
  }
}

export async function reconcilePayments(env: WorkerEnv): Promise<void> {
  const pending = await rpc<
    { provider_event_id: string; processing_state: string; replay_requested_by: string | null }[]
  >(
    env,
    'list_pending_payment_events',
    {},
  );
  let enqueued = 0;
  let replays = 0;
  for (const event of pending) {
    try {
      await env.PAYMENT_EVENT_QUEUE.send({
        type: 'payment.process',
        eventId: event.provider_event_id,
      });
      enqueued += 1;
      if (event.processing_state === 'replay_requested') {
        await rpc(env, 'mark_payment_event_replay_enqueued', {
          target_event_id: event.provider_event_id,
        });
        // Same admin_audit handoff channel as the attachment replay above.
        if (event.replay_requested_by) {
          await rpc(env, 'log_admin_audit', {
            actor: event.replay_requested_by,
            action: 'payment_event_replay_enqueued',
            target_type: 'payment_event',
            target_id: event.provider_event_id,
          });
        }
        replays += 1;
      }
    } catch {
      // Durable received/replay_requested state remains for the next Cron run.
    }
  }
  logPayment('info', {
    event: 'payment_reconciliation',
    pending: pending.length,
    enqueued,
    replays,
  });
}

export async function reconcileLifecycle(env: WorkerEnv): Promise<void> {
  const results = await Promise.allSettled([
    reconcileAttachments(env),
    reconcilePayments(env),
  ]);
  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('one or more lifecycle reconciliation passes failed');
  }
}
