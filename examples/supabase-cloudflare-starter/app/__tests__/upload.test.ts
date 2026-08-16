/**
 * Smoke tests for the /upload route (#983): loader and action factories
 * run against a stubbed Supabase client (the real client stays behind
 * lib/supabase-server.ts, composition boundary #981).
 */
import { assert, assertEquals, assertRejects } from '@std/assert';
import { isActionFailure, isOpenElementRedirect } from '@openelement/app';

// Route modules register their page element at module scope; Deno has no
// custom element registry, so shim one before importing the route.
if (!('customElements' in globalThis)) {
  (globalThis as { customElements?: unknown }).customElements = {
    define: () => {},
    get: () => undefined,
  };
}

const {
  ALLOWED_CONTENT_TYPES,
  BUCKET,
  createDeleteAction,
  createUploadAction,
  createUploadLoader,
  MAX_FILE_BYTES,
  objectKeyFor,
  ownsObjectKey,
  sanitizeFilename,
} = await import('../routes/upload.tsx');
type UploadSupabaseClient = import('../routes/upload.tsx').UploadSupabaseClient;

const USER = { id: 'user-123', email: 'tester@example.com' };

function stubClient(overrides: {
  user?: { id: string; email?: string } | null;
  listData?: { name: string }[] | null;
  listError?: { message: string } | null;
  uploadError?: { message: string } | null;
  removeError?: { message: string } | null;
  rpcErrors?: Record<string, { message: string }>;
  onUpload?: (path: string, file: File) => void;
  onRemove?: (paths: string[]) => void;
  onRpc?: (name: string, args: Record<string, unknown>) => void;
}): () => UploadSupabaseClient {
  const {
    user = USER,
    listData = [],
    listError = null,
    uploadError = null,
    removeError = null,
    rpcErrors = {},
    onUpload,
    onRemove,
    onRpc,
  } = overrides;
  return () => ({
    auth: { getUser: () => Promise.resolve({ data: { user } }) },
    storage: {
      from: (bucket: string) => {
        assertEquals(bucket, BUCKET);
        return {
          list: () => Promise.resolve({ data: listData, error: listError }),
          upload: (path: string, file: File) => {
            onUpload?.(path, file);
            return Promise.resolve({ error: uploadError });
          },
          createSignedUrl: (path: string, expiresIn: number) =>
            Promise.resolve({
              data: { signedUrl: `https://storage.test/${path}?expires=${expiresIn}` },
              error: null,
            }),
          remove: (paths: string[]) => {
            onRemove?.(paths);
            return Promise.resolve({ error: removeError });
          },
        };
      },
    },
    rpc: (name: string, args: Record<string, unknown>) => {
      onRpc?.(name, args);
      return Promise.resolve({ error: rpcErrors[name] ?? null });
    },
  });
}

const ctx = () => ({
  request: new Request('http://localhost/upload'),
  env: {},
  responseHeaders: new Headers(),
});

Deno.test('sanitizeFilename strips path traversal and unsafe characters', () => {
  assertEquals(sanitizeFilename('../../etc/passwd'), 'passwd');
  assertEquals(sanitizeFilename('C:\\tmp\\my file!.txt'), 'my_file_.txt');
  assertEquals(sanitizeFilename('plain.md'), 'plain.md');
});

Deno.test('objectKeyFor scopes the object to the owner folder', () => {
  const first = objectKeyFor('user-123', 'a.txt');
  const second = objectKeyFor('user-123', 'a.txt');
  assert(first.startsWith('user-123/'));
  assert(first.endsWith('-a.txt'));
  assert(first !== second);
  assert(ownsObjectKey('user-123', first));
  assert(!ownsObjectKey('other-user', first));
  assert(!ownsObjectKey('user-123', 'user-123/nested/a.txt'));
});

Deno.test('loader renders the denied branch for anonymous requests', async () => {
  const loader = createUploadLoader(stubClient({ user: null }));
  assertEquals(await loader(ctx()), { denied: true });
});

Deno.test('loader lists the owner folder for signed-in requests', async () => {
  const loader = createUploadLoader(
    stubClient({ listData: [{ name: 'a.txt' }] }),
  );
  assertEquals(await loader(ctx()), {
    denied: false,
    email: USER.email,
    files: [{
      name: 'a.txt',
      key: 'user-123/a.txt',
      downloadUrl: 'https://storage.test/user-123/a.txt?expires=60',
    }],
  });
});

Deno.test('action rejects anonymous uploads with 401', async () => {
  const action = createUploadAction(stubClient({ user: null }));
  const formData = new FormData();
  formData.set('file', new File(['x'], 'a.txt', { type: 'text/plain' }));
  const result = await action({ ...ctx(), formData });
  assert(isActionFailure(result));
  assertEquals(result.status, 401);
});

Deno.test('action rejects a missing file with 422', async () => {
  const action = createUploadAction(stubClient({}));
  const result = await action({ ...ctx(), formData: new FormData() });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
});

Deno.test('action rejects files over the reference cap with 422', async () => {
  const action = createUploadAction(stubClient({}));
  const formData = new FormData();
  formData.set(
    'file',
    new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.bin'),
  );
  const result = await action({ ...ctx(), formData });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
});

Deno.test('action rejects content types outside the allowlist', async () => {
  assert(ALLOWED_CONTENT_TYPES.has('text/plain'));
  const action = createUploadAction(stubClient({}));
  const formData = new FormData();
  formData.set('file', new File(['x'], 'script.js', { type: 'text/javascript' }));
  const result = await action({ ...ctx(), formData });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
});

Deno.test('action uploads under the owner key and redirects (PRG)', async () => {
  let uploadedPath = '';
  const action = createUploadAction(
    stubClient({ onUpload: (path) => uploadedPath = path }),
  );
  const formData = new FormData();
  formData.set(
    'file',
    new File(['hello'], 'hello.txt', { type: 'text/plain' }),
  );
  const error = await assertRejects(() => action({ ...ctx(), formData }));
  assert(isOpenElementRedirect(error));
  assert(uploadedPath.startsWith('user-123/'));
  assert(uploadedPath.endsWith('-hello.txt'));
});

Deno.test('action surfaces storage errors as 422', async () => {
  const action = createUploadAction(
    stubClient({ uploadError: { message: 'row level security' } }),
  );
  const formData = new FormData();
  formData.set('file', new File(['x'], 'a.txt', { type: 'text/plain' }));
  const result = await action({ ...ctx(), formData });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
  assertEquals(result.data, { error: 'row level security' });
});

Deno.test('action atomically reserves and releases quota when upload fails', async () => {
  const calls: string[] = [];
  const action = createUploadAction(stubClient({
    uploadError: { message: 'storage unavailable' },
    onRpc: (name) => calls.push(name),
  }));
  const formData = new FormData();
  formData.set('file', new File(['x'], 'a.txt', { type: 'text/plain' }));
  const result = await action({ ...ctx(), formData });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
  assertEquals(calls, ['reserve_attachment', 'release_attachment']);
});

Deno.test('delete rejects a cross-user object key before Storage', async () => {
  const action = createDeleteAction(stubClient({}));
  const formData = new FormData();
  formData.set('key', 'other-user/secret.txt');
  const result = await action({ ...ctx(), formData });
  assert(isActionFailure(result));
  assertEquals(result.status, 403);
});

Deno.test('delete removes the owner object and releases quota', async () => {
  const removed: string[][] = [];
  const calls: string[] = [];
  const action = createDeleteAction(stubClient({
    onRemove: (paths) => removed.push(paths),
    onRpc: (name) => calls.push(name),
  }));
  const formData = new FormData();
  formData.set('key', 'user-123/opaque-a.txt');
  const error = await assertRejects(() => action({ ...ctx(), formData }));
  assert(isOpenElementRedirect(error));
  assertEquals(removed, [['user-123/opaque-a.txt']]);
  assertEquals(calls, ['release_attachment_by_key']);
});
