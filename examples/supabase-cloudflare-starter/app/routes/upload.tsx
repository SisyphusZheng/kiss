/**
 * /upload — Supabase Storage upload with authorization (reference starter, #983).
 *
 * A no-JS-capable multipart form posts to the named action `upload`. The
 * action reads the session from the request cookies (same @supabase/ssr
 * channel as /notes) and uploads into the private `notes-attachments`
 * bucket under the owner's folder ("<auth.uid()>/<filename>"), so the
 * storage RLS policies (supabase/migrations/20260816000001) scope every
 * object to its owner. Anonymous posts get a 401; the same write would
 * also be rejected by the database.
 *
 * The loader/action cores are factories taking the Supabase client factory
 * as a parameter (defaulting to the real one) so app/__tests__ can
 * exercise them against a stub — composition boundary #981 keeps the
 * official client behind lib/supabase-server.ts.
 */
import {
  type ActionContext,
  definePage,
  fail,
  type LoaderContext,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { ATTACHMENT_BUCKET } from '../../lib/cloudflare-queues.ts';

export const tagName = 'page-upload';

export const BUCKET = ATTACHMENT_BUCKET;
/** Reference cap (1 MiB) — a starter guardrail, not a Supabase limit. */
export const MAX_FILE_BYTES = 1024 * 1024;
export const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
]);

interface UploadLoaderData {
  denied: boolean;
  email?: string;
  files?: { name: string; key: string; downloadUrl: string }[];
  error?: string;
}

interface UploadActionData {
  error?: string;
}

/** Minimal structural surface the route needs from the Supabase client. */
export interface UploadSupabaseClient {
  auth: {
    getUser(): Promise<
      { data: { user: { id: string; email?: string } | null } }
    >;
  };
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        file: File,
        options?: { contentType?: string; upsert?: boolean },
      ): Promise<{ error: { message: string } | null }>;
      createSignedUrl(
        path: string,
        expiresIn: number,
      ): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
      remove(paths: string[]): Promise<{ error: { message: string } | null }>;
    };
  };
  rpc(
    name: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data?: unknown; error: { message: string } | null }>;
}

export type UploadClientFactory = (
  env: Record<string, unknown>,
  request: Request,
  responseHeaders: Headers,
) => UploadSupabaseClient;

/** Basename-only, storage-safe file name segment (no path traversal). */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  return base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 128);
}

/** Objects live under the owner's folder so storage RLS can scope by prefix. */
export function objectKeyFor(userId: string, filename: string): string {
  return `${userId}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}

export function ownsObjectKey(userId: string, key: string): boolean {
  return key.startsWith(`${userId}/`) && !key.slice(userId.length + 1).includes('/');
}

export function createUploadLoader(
  createClient: UploadClientFactory = createServerSupabase,
) {
  return async function loader(
    ctx: LoaderContext<Record<string, unknown>>,
  ): Promise<UploadLoaderData> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { denied: true };
    const { data, error } = await supabase.rpc('list_downloadable_attachments', {});
    if (error) {
      return { denied: false, email: user.email, error: error.message };
    }
    const rows = (data ?? []) as { object_key: string; display_name: string }[];
    const files = await Promise.all(rows.map(async (file) => {
      const signed = await supabase.storage.from(BUCKET).createSignedUrl(file.object_key, 60);
      return {
        key: file.object_key,
        name: file.display_name,
        downloadUrl: signed.error ? '' : signed.data?.signedUrl ?? '',
      };
    }));
    return {
      denied: false,
      email: user.email,
      files,
    };
  };
}

export function createUploadAction(
  createClient: UploadClientFactory = createServerSupabase,
) {
  return async function upload(
    ctx: ActionContext<Record<string, unknown>>,
  ): Promise<OpenElementActionFailure<UploadActionData>> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, { error: 'sign-in required to upload' });
    const file = ctx.formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return fail(422, { error: 'a non-empty file is required' });
    }
    if (file.size > MAX_FILE_BYTES) {
      return fail(422, { error: 'file exceeds the 1 MiB reference cap' });
    }
    if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
      return fail(422, { error: 'file type is not allowed' });
    }
    const displayName = sanitizeFilename(file.name || 'upload.bin');
    const reservationId = crypto.randomUUID();
    const key = objectKeyFor(user.id, displayName);
    const reserved = await supabase.rpc('reserve_attachment', {
      reservation_id: reservationId,
      object_key: key,
      display_name: displayName,
      byte_size: file.size,
      content_type: file.type || 'application/octet-stream',
    });
    if (reserved.error) return fail(422, { error: reserved.error.message });
    // Never silently overwrite: different originals can normalize to the same
    // key, and upsert:true would lose the earlier file without a trace.
    const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) {
      await supabase.rpc('release_attachment', { reservation_id: reservationId });
      return fail(422, { error: error.message });
    }
    const finalized = await supabase.rpc('finalize_attachment', {
      reservation_id: reservationId,
    });
    if (finalized.error) {
      await supabase.storage.from(BUCKET).remove([key]);
      await supabase.rpc('release_attachment', { reservation_id: reservationId });
      throw new Error('upload could not be finalized');
    }
    const queue = ctx.env.ATTACHMENT_SCAN_QUEUE as
      | { send(message: Record<string, string>): Promise<void> }
      | undefined;
    if (queue) {
      try {
        await queue.send({ type: 'attachment.scan', reservationId, objectKey: key });
      } catch {
        // The row stays pending_scan; scheduled reconciliation re-enqueues it.
      }
    }
    throw redirect('/upload');
  };
}

export function createDeleteAction(
  createClient: UploadClientFactory = createServerSupabase,
) {
  return async function remove(
    ctx: ActionContext<Record<string, unknown>>,
  ): Promise<OpenElementActionFailure<UploadActionData>> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, { error: 'sign-in required to delete' });
    const key = String(ctx.formData.get('key') ?? '');
    if (!ownsObjectKey(user.id, key)) return fail(403, { error: 'invalid object owner' });
    const removed = await supabase.storage.from(BUCKET).remove([key]);
    if (removed.error) return fail(422, { error: removed.error.message });
    const released = await supabase.rpc('release_attachment_by_key', { target_key: key });
    if (released.error) throw new Error('object deleted but quota release failed');
    throw redirect('/upload');
  };
}

export const loader = createUploadLoader();
export const actions = { upload: createUploadAction(), delete: createDeleteAction() };

const UploadPage = definePage<UploadLoaderData>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Upload — reference starter' },
  render() {
    const data = useLoaderData() as UploadLoaderData;
    const actionData = useActionData() as UploadActionData | undefined;
    if (data.denied) {
      return (
        <main>
          <h1>Upload</h1>
          <section id='denied'>
            <p>
              Sign-in is required to upload. Storage RLS rejects anonymous writes server-side.
            </p>
            <p>
              <a href='/login'>Go to sign-in</a>
            </p>
          </section>
        </main>
      );
    }
    return (
      <main>
        <h1>Upload</h1>
        <p id='who'>signed-in:{data.email}</p>
        {data.error ? <p id='error'>{data.error}</p> : null}
        {actionData?.error ? <p id='action-error'>{actionData.error}</p> : null}
        <form
          method='post'
          action='/upload?/upload'
          enctype='multipart/form-data'
        >
          <p>
            <label>
              File <input type='file' name='file' required />
            </label>
          </p>
          <button type='submit'>Upload</button>
        </form>
        <ul id='files'>
          {(data.files ?? []).map((file) => (
            <li key={file.key}>
              {file.downloadUrl ? <a href={file.downloadUrl}>{file.name}</a> : file.name}{' '}
              <form method='post' action='/upload?/delete'>
                <input type='hidden' name='key' value={file.key} />
                <button type='submit'>Delete</button>
              </form>
            </li>
          ))}
        </ul>
        <p>
          <a href='/notes'>Back to notes</a>
        </p>
      </main>
    );
  },
});

customElements.define(tagName, UploadPage);
export default UploadPage;
