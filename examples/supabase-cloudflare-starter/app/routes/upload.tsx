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
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';
import { createServerSupabase } from '../../lib/supabase-server.ts';

export const tagName = 'page-upload';

export const BUCKET = 'notes-attachments';
/** Reference cap (1 MiB) — a starter guardrail, not a Supabase limit. */
export const MAX_FILE_BYTES = 1024 * 1024;

interface UploadLoaderData {
  denied: boolean;
  email?: string;
  files?: string[];
  error?: string;
}

interface UploadActionData {
  error?: string;
}

interface RequestContext {
  request: Request;
  env: Record<string, string>;
  responseHeaders: Headers;
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
      list(
        path: string,
        options?: { limit?: number },
      ): Promise<
        { data: { name: string }[] | null; error: { message: string } | null }
      >;
      upload(
        path: string,
        file: File,
        options?: { contentType?: string; upsert?: boolean },
      ): Promise<{ error: { message: string } | null }>;
    };
  };
}

export type UploadClientFactory = (
  env: Record<string, string>,
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
  return `${userId}/${sanitizeFilename(filename)}`;
}

export function createUploadLoader(
  createClient: UploadClientFactory = createServerSupabase,
) {
  return async function loader(ctx: RequestContext): Promise<UploadLoaderData> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { denied: true };
    const { data, error } = await supabase.storage.from(BUCKET).list(user.id, {
      limit: 100,
    });
    if (error) {
      return { denied: false, email: user.email, error: error.message };
    }
    return {
      denied: false,
      email: user.email,
      files: (data ?? []).map((file) => file.name),
    };
  };
}

export function createUploadAction(
  createClient: UploadClientFactory = createServerSupabase,
) {
  return async function upload(
    ctx: RequestContext & { formData: FormData },
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
    const key = objectKeyFor(user.id, file.name || 'upload.bin');
    // Never silently overwrite: different originals can normalize to the same
    // key, and upsert:true would lose the earlier file without a trace.
    const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) {
      const duplicate = /already exists|Duplicate/i.test(error.message);
      return fail(422, {
        error: duplicate
          ? `a file named '${
            sanitizeFilename(file.name || 'upload.bin')
          }' already exists — rename it to upload a new one`
          : error.message,
      });
    }
    throw redirect('/upload');
  };
}

export const loader = createUploadLoader();
export const actions = { upload: createUploadAction() };

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
          {(data.files ?? []).map((name) => <li key={name}>{name}</li>)}
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
