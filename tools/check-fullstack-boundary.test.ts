import { assertEquals } from '@std/assert';
import {
  findCacheBoundaryIssues,
  findEnvExampleLeaks,
  findSecretLeaks,
  parseRequestTimeRoutePaths,
  sliceRouteHandlers,
} from './check-fullstack-boundary.ts';

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

Deno.test('fullstack-boundary: sliceRouteHandlers ignores indented doc-comment examples', () => {
  const source = [
    " * app.post('/entry', async (c) => {",
    'app.get("/notes", async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '});',
    'app.post("/login", bodyLimit({',
    '\tc.header("Cache-Control", "no-store");',
    '}), async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '});',
  ].join('\n');
  const handlers = sliceRouteHandlers(source);
  assertEquals(handlers.length, 2);
  assertEquals(handlers[0].method, 'get');
  assertEquals(handlers[0].path, '/notes');
  assertEquals(handlers[1].method, 'post');
  assertEquals(handlers[1].path, '/login');
});

Deno.test('fullstack-boundary: parseRequestTimeRoutePaths reads the generated route table', () => {
  const indexSource = [
    'const requestTimeRoutes = [',
    '  { path: "/login", paramNames: [], pattern: new URLPattern({ pathname: "/login" }) },',
    '  { path: "/notes", paramNames: [], pattern: new URLPattern({ pathname: "/notes" }) },',
    '];',
  ].join('\n');
  assertEquals(parseRequestTimeRoutePaths(indexSource), ['/login', '/notes']);
});

Deno.test('fullstack-boundary: no-store baseline with the #943 private relaxation passes', () => {
  const entry = [
    'app.get("/notes", async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '\tif (ok) c.header("Cache-Control", "private, no-cache");',
    '});',
    'app.post("/notes", bodyLimit({}), async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '});',
  ].join('\n');
  assertEquals(findCacheBoundaryIssues(entry, ['/notes']), []);
});

Deno.test('fullstack-boundary: a handler without the no-store baseline is flagged', () => {
  const entry = [
    'app.get("/notes", async (c) => {',
    '\treturn c.html("notes");',
    '});',
  ].join('\n');
  const issues = findCacheBoundaryIssues(entry, ['/notes']);
  assertEquals(issues.length, 1);
  assertEquals(issues[0].check, 'cache-boundary');
  assertEquals(issues[0].message.includes('no-store'), true);
});

Deno.test('fullstack-boundary: a publicly cacheable emission is flagged', () => {
  const entry = [
    'app.get("/notes", async (c) => {',
    '\tc.header("Cache-Control", "no-store");',
    '\tc.header("Cache-Control", "public, max-age=60");',
    '});',
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
