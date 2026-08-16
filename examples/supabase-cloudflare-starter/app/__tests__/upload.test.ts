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
  BUCKET,
  createUploadAction,
  createUploadLoader,
  MAX_FILE_BYTES,
  objectKeyFor,
  sanitizeFilename,
} = await import('../routes/upload.tsx');
type UploadSupabaseClient = import('../routes/upload.tsx').UploadSupabaseClient;

const USER = { id: 'user-123', email: 'tester@example.com' };

function stubClient(overrides: {
  user?: { id: string; email?: string } | null;
  listData?: { name: string }[] | null;
  listError?: { message: string } | null;
  uploadError?: { message: string } | null;
  onUpload?: (path: string, file: File) => void;
}): () => UploadSupabaseClient {
  const {
    user = USER,
    listData = [],
    listError = null,
    uploadError = null,
    onUpload,
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
        };
      },
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
  assertEquals(objectKeyFor('user-123', 'a.txt'), 'user-123/a.txt');
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
    files: ['a.txt'],
  });
});

Deno.test('action rejects anonymous uploads with 401', async () => {
  const action = createUploadAction(stubClient({ user: null }));
  const formData = new FormData();
  formData.set('file', new File(['x'], 'a.txt'));
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
  assertEquals(uploadedPath, 'user-123/hello.txt');
});

Deno.test('action surfaces storage errors as 422', async () => {
  const action = createUploadAction(
    stubClient({ uploadError: { message: 'row level security' } }),
  );
  const formData = new FormData();
  formData.set('file', new File(['x'], 'a.txt'));
  const result = await action({ ...ctx(), formData });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
  assertEquals(result.data, { error: 'row level security' });
});

Deno.test('action never silently overwrites an existing object (collision gets a 422)', async () => {
  const action = createUploadAction(
    stubClient({ uploadError: { message: 'The resource already exists' } }),
  );
  const formData = new FormData();
  // Two originals that normalize to the same key: the second must be told,
  // not silently overwrite the first (upsert stays off).
  formData.set('file', new File(['x'], 'a b.txt'));
  const result = await action({ ...ctx(), formData });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
  assert((result.data?.error ?? '').includes('already exists'));
});
