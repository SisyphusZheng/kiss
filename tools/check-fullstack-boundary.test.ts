import { assertEquals } from '@std/assert';
import {
  findCacheBoundaryIssues,
  findEnvExampleLeaks,
  findSecretLeaks,
  findStoragePolicyIssues,
  parseRequestTimeRoutePaths,
  sliceRouteHandlers,
} from './check-fullstack-boundary.ts';

const STORAGE_POLICY_BASELINE = `
create policy "read" on storage.objects for select to authenticated using (true);
create policy "upload" on storage.objects for insert to authenticated with check (true);
create policy "delete" on storage.objects for delete to authenticated using (true);
`;

Deno.test('fullstack-boundary: clean browser bundle produces no secret leaks', () => {
  const issues = findSecretLeaks([
    { path: 'dist/index.html', text: '<html><body>Notes</body></html>' },
    { path: 'dist/assets/app.js', text: 'const anonKey = "public-anon-key";' },
  ]);
  assertEquals(issues, []);
});

Deno.test('fullstack-boundary: service-role assignment in a bundle is flagged with location', () => {
  const issues = findSecretLeaks([
    {
      path: 'dist/assets/app.js',
      text: 'const ok = 1;\nconst cfg = { SERVICE_ROLE_KEY: "live-value" };',
    },
  ]);
  assertEquals(issues.length, 1);
  assertEquals(issues[0].check, 'secret-leak');
  assertEquals(issues[0].file, 'dist/assets/app.js');
  assertEquals(issues[0].line, 2);
});

Deno.test('fullstack-boundary: the bare terms in library code are NOT flagged', () => {
  // supabase-js itself contains the words service_role / sb_secret_ — the
  // gate matches secret VALUES, not names.
  const issues = findSecretLeaks([
    {
      path: 'dist/assets/vendor.js',
      text:
        'const keyName = "service_role"; if (key.startsWith("sb_secret_")) warn(); env.SUPABASE_SERVICE_ROLE_KEY;',
    },
  ]);
  assertEquals(issues, []);
});

Deno.test('fullstack-boundary: sb_secret_ key material and JWT-shaped tokens are flagged', () => {
  const issues = findSecretLeaks([
    { path: 'dist/index.html', text: 'sb_secret_abc1234567890' },
    { path: 'dist/assets/app.js', text: 'const t = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abc";' },
  ]);
  assertEquals(issues.length, 2);
  assertEquals(issues[0].message.includes('secret key'), true);
  assertEquals(issues[1].message.includes('JWT'), true);
});

Deno.test('fullstack-boundary: sliceRouteHandlers slices the generated page-handler table', () => {
  const source = [
    'const __pageHandlers = {};',
    '// __pageHandlers["/entry"].GET mentioned without assignment must not match',
    '__pageHandlers["/notes"].GET = [async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '}];',
    '__pageHandlers["/login"].POST = [__bodyLimit({ maxSize: 1024 }), async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '}];',
  ].join('\n');
  const handlers = sliceRouteHandlers(source);
  assertEquals(handlers.length, 2);
  assertEquals(handlers[0].method, 'get');
  assertEquals(handlers[0].path, '/notes');
  assertEquals(handlers[1].method, 'post');
  assertEquals(handlers[1].path, '/login');
});

Deno.test('fullstack-boundary: parseRequestTimeRoutePaths reads the generated admission patterns', () => {
  const indexSource = [
    'const requestTimePatterns = [',
    '  new URLPattern({ pathname: "/login" }),',
    '  new URLPattern({ pathname: "/notes" }),',
    '];',
  ].join('\n');
  assertEquals(parseRequestTimeRoutePaths(indexSource), ['/login', '/notes']);
});

Deno.test('fullstack-boundary: no-store baseline with the #943 private relaxation passes', () => {
  const entry = [
    '__pageHandlers["/notes"].GET = [async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '\tif (ok) c.header("Cache-Control", "private, no-cache");',
    '}];',
    '__pageHandlers["/notes"].POST = [__bodyLimit({}), async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '}];',
  ].join('\n');
  assertEquals(findCacheBoundaryIssues(entry, ['/notes']), []);
});

Deno.test('fullstack-boundary: a handler without the no-store baseline is flagged', () => {
  const entry = [
    '__pageHandlers["/notes"].GET = [async (c) => {',
    '\treturn c.html("notes");',
    '}];',
  ].join('\n');
  const issues = findCacheBoundaryIssues(entry, ['/notes']);
  assertEquals(issues.length, 1);
  assertEquals(issues[0].check, 'cache-boundary');
  assertEquals(issues[0].message.includes('no-store'), true);
});

Deno.test('fullstack-boundary: a publicly cacheable emission is flagged', () => {
  const entry = [
    '__pageHandlers["/notes"].GET = [async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '\tc.header("Cache-Control", "public, max-age=60");',
    '}];',
  ].join('\n');
  const issues = findCacheBoundaryIssues(entry, ['/notes']);
  assertEquals(issues.length, 1);
  assertEquals(issues[0].message.includes('publicly cacheable'), true);
});

Deno.test('fullstack-boundary: a request-time route without a GET handler is vacuous and flagged', () => {
  assertEquals(findCacheBoundaryIssues('const x = 1;', ['/notes']).length, 1);
});

Deno.test('fullstack-boundary: placeholder .env.example passes', () => {
  const text = [
    'SUPABASE_URL=https://your-project-ref.supabase.co',
    'SUPABASE_ANON_KEY=your-anon-public-key',
  ].join('\n');
  assertEquals(findEnvExampleLeaks(text), []);
});

Deno.test('fullstack-boundary: real credential material in .env.example is flagged', () => {
  const text = [
    'SUPABASE_URL=https://abcdef.supabase.co',
    'SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9payload',
    'SUPABASE_SERVICE_ROLE_KEY=sb_secret_livevalue123456',
  ].join('\n');
  const issues = findEnvExampleLeaks(text);
  assertEquals(issues.length, 2);
  assertEquals(issues[0].line, 2);
  assertEquals(issues[1].line, 3);
});

Deno.test('fullstack-boundary: immutable storage policy operations pass', () => {
  assertEquals(findStoragePolicyIssues(STORAGE_POLICY_BASELINE), []);
});

Deno.test('fullstack-boundary: adding object UPDATE access is flagged', () => {
  const issues = findStoragePolicyIssues(
    `${STORAGE_POLICY_BASELINE}\ncreate policy "overwrite" on storage.objects for update using (true);`,
  );
  assertEquals(issues.length, 1);
  assertEquals(issues[0].check, 'storage-policy');
  assertEquals(issues[0].message.includes('update'), true);
});

Deno.test('fullstack-boundary: policies restated across aggregated migrations still pass (#1059)', () => {
  const restated =
    'create policy "read again" on storage.objects for select to authenticated using (true);';
  assertEquals(findStoragePolicyIssues(`${STORAGE_POLICY_BASELINE}\n${restated}`), []);
});

Deno.test('fullstack-boundary: a required operation missing from the aggregate is flagged (#1059)', () => {
  const withoutInsert = STORAGE_POLICY_BASELINE.replace(
    /create policy "upload" on storage\.objects for insert[^\n]*\n/,
    '',
  );
  const issues = findStoragePolicyIssues(withoutInsert);
  assertEquals(issues.length, 1);
  assertEquals(issues[0].check, 'storage-policy');
});
