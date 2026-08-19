import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';
import { type AuthenticatedIdentity, requireAdmin } from '../../lib/authorization.ts';
import { UUID_PATTERN } from '../../lib/service-role.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
export const tagName = 'page-admin';
interface DeadLetter {
  id: string;
  object_key: string;
  state: 'dead_letter' | 'replay_requested' | 'replayed';
  delivery_count: number;
  first_failed_at: string;
}
interface PaymentDeadLetter {
  provider_event_id: string;
  event_type: string;
  processing_state: 'dead_letter' | 'replay_requested';
  delivery_count: number;
  dead_lettered_at: string;
}
interface Data {
  email?: string;
  noteCount: number;
  deadLetters: DeadLetter[];
  paymentDeadLetters: PaymentDeadLetter[];
  error?: string;
}
interface AdminClient {
  auth: {
    getUser(): Promise<{
      data: { user: (AuthenticatedIdentity & { email?: string }) | null };
    }>;
  };
  from(name: string): {
    select(column: string, options: { count: 'exact'; head: true }): Promise<{
      count: number | null;
      error: { message: string } | null;
    }>;
    insert(row: Record<string, unknown>): Promise<{
      error: { message: string } | null;
    }>;
  };
  rpc(name: string, body?: Record<string, string>): Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}
type AdminContext = { env: Record<string, string>; request: Request; responseHeaders: Headers };

// The browser receives no service-role material. These calls use the signed-in
// user's JWT; SQL independently requires issuer-controlled app_metadata.admin.
export function createAdminLoader(
  createClient: (env: Record<string, string>, request: Request, headers: Headers) => AdminClient =
    createServerSupabase as never,
) {
  return async function adminLoader(ctx: AdminContext): Promise<Data> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    requireAdmin(user);
    const [{ count, error }, deadLetters, paymentDeadLetters] = await Promise.all([
      supabase.from('notes').select('id', { count: 'exact', head: true }),
      supabase.rpc('list_attachment_scan_dead_letters'),
      supabase.rpc('list_payment_event_dead_letters'),
    ]);
    return {
      email: user?.email,
      noteCount: count ?? 0,
      deadLetters: (deadLetters.data ?? []) as DeadLetter[],
      paymentDeadLetters: (paymentDeadLetters.data ?? []) as PaymentDeadLetter[],
      error: error?.message ?? deadLetters.error?.message ?? paymentDeadLetters.error?.message,
    };
  };
}

export function createPaymentReplayAction(
  createClient: (env: Record<string, string>, request: Request, headers: Headers) => AdminClient =
    createServerSupabase as never,
) {
  return async function replayPayment(
    ctx: AdminContext & { formData: FormData },
  ): Promise<OpenElementActionFailure<{ error: string }>> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    requireAdmin(user);
    const eventId = String(ctx.formData.get('event_id') ?? '');
    if (!/^evt_[A-Za-z0-9_]+$/.test(eventId)) {
      return fail(422, { error: 'invalid payment event id' });
    }
    const { error } = await supabase.rpc('request_payment_event_replay', {
      target_event_id: eventId,
    });
    if (error) return fail(422, { error: error.message });
    // Append-only audit of the admin-sensitive action (#998): the RLS
    // "admins append" policy pins actor_id to the caller, and the row carries
    // ids only — no PII, no secrets. A failed audit write surfaces loudly
    // instead of leaving an unaudited state change.
    const audit = await supabase.from('admin_audit').insert({
      actor_id: user.id,
      action: 'payment_event_replay_requested',
      target_type: 'payment_event',
      target_id: eventId,
    });
    if (audit.error) return fail(422, { error: audit.error.message });
    throw redirect('/admin');
  };
}

export function createReplayAction(
  createClient: (env: Record<string, string>, request: Request, headers: Headers) => AdminClient =
    createServerSupabase as never,
) {
  return async function replay(
    ctx: AdminContext & { formData: FormData },
  ): Promise<OpenElementActionFailure<{ error: string }>> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    requireAdmin(user);
    const id = String(ctx.formData.get('id') ?? '');
    if (!UUID_PATTERN.test(id)) {
      return fail(422, { error: 'invalid dead-letter id' });
    }
    const { error } = await supabase.rpc('request_attachment_scan_replay', {
      dead_letter_id: id,
    });
    if (error) return fail(422, { error: error.message });
    // Same append-only admin_audit channel as the payment replay above.
    const audit = await supabase.from('admin_audit').insert({
      actor_id: user.id,
      action: 'attachment_scan_replay_requested',
      target_type: 'attachment_scan_dead_letter',
      target_id: id,
    });
    if (audit.error) return fail(422, { error: audit.error.message });
    throw redirect('/admin');
  };
}

export const loader = createAdminLoader();
export const actions = {
  replay: createReplayAction(),
  replayPayment: createPaymentReplayAction(),
};
const Page = definePage<Data>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Admin' },
  render() {
    const data = useLoaderData() as Data;
    const actionData = useActionData() as { error?: string } | undefined;
    return (
      <main>
        <h1>Admin</h1>
        <p>signed-in:{data.email}</p>
        {data.error ? <p id='error'>{data.error}</p> : null}
        {actionData?.error ? <p id='action-error'>{actionData.error}</p> : null}
        <p id='note-count'>notes:{data.noteCount}</p>
        <h2>Attachment scan dead letters</h2>
        <ul id='attachment-dead-letters'>
          {data.deadLetters.map((item) => (
            <li key={item.id}>
              <code>{item.object_key}</code>{' '}
              <span>{item.state} (deliveries:{item.delivery_count})</span>{' '}
              {item.state === 'dead_letter'
                ? (
                  <form method='post' action='/admin?/replay'>
                    <input type='hidden' name='id' value={item.id} />
                    <button type='submit'>Request replay</button>
                  </form>
                )
                : null}
            </li>
          ))}
        </ul>
        <h2>Payment event dead letters</h2>
        <ul id='payment-dead-letters'>
          {data.paymentDeadLetters.map((item) => (
            <li key={item.provider_event_id}>
              <code>{item.provider_event_id}</code>{' '}
              <span>
                {item.event_type} — {item.processing_state} (deliveries:{item.delivery_count})
              </span>{' '}
              {item.processing_state === 'dead_letter'
                ? (
                  <form method='post' action='/admin?/replayPayment'>
                    <input type='hidden' name='event_id' value={item.provider_event_id} />
                    <button type='submit'>Request payment replay</button>
                  </form>
                )
                : null}
            </li>
          ))}
        </ul>
      </main>
    );
  },
});
customElements.define(tagName, Page);
export default Page;
