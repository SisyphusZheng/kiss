import { WORKSPACE_HTML_BUDGET_BYTES } from '../lib/workspace-pagination.ts';
import {
  NOTES_HTML_BUDGET_BYTES,
  NOTES_PAGE_SIZE,
} from '../examples/supabase-cloudflare-starter/lib/notes-pagination.ts';

const ROOT = new URL('../', import.meta.url);
const STARTER = new URL('../examples/supabase-cloudflare-starter/', import.meta.url);
const NODE_ENTRY = new URL('dist/server/serve.mjs', STARTER);
const WORKERS_ENTRY = new URL('.output-workers/server/index.mjs', STARTER);
const WORKSPACE_ID = '123e4567-e89b-42d3-a456-426614174000';
const USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const TOTAL_ROWS = 10_001;
const SAMPLES = 10;

function base64Url(value: string): string {
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function reservePort(): number {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  listener.close();
  return port;
}

function workspaceRows(url: URL) {
  if (url.searchParams.get('workspace_id') !== `eq.${WORKSPACE_ID}`) return [];
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 51), 51);
  const cursor = /id\.lt\.(\d+)/.exec(url.searchParams.get('or') ?? '');
  const firstId = cursor ? Number(cursor[1]) - 1 : TOTAL_ROWS;
  const status = url.searchParams.get('status')?.replace(/^eq\./, '');
  const titlePrefix = url.searchParams.get('title')?.replace(/^ilike\./, '').replace(/%$/, '');
  const rows: { id: number; title: string; status: string; created_at: string }[] = [];
  for (let id = firstId; id >= 1 && rows.length < limit; id--) {
    const rowStatus = id % 2 === 0 ? 'active' : 'archived';
    const title = `qualification-record-${id}`;
    if (status && status !== rowStatus) continue;
    if (titlePrefix && !title.startsWith(titlePrefix)) continue;
    rows.push({
      id,
      title,
      status: rowStatus,
      created_at: new Date(Date.UTC(2026, 7, 23) + id * 1_000).toISOString(),
    });
  }
  return rows;
}

function noteId(id: number): string {
  return `123e4567-e89b-42d3-a456-${String(426614100000 + id).padStart(12, '0')}`;
}

function noteRows(url: URL) {
  const limit = Math.min(Number(url.searchParams.get('limit') ?? NOTES_PAGE_SIZE + 1), 11);
  const cursor = /id\.lt\.([0-9a-f-]+)/iu.exec(url.searchParams.get('or') ?? '');
  const cursorId = cursor ? Number(cursor[1].slice(-12)) - 426614100000 : TOTAL_ROWS + 1;
  const rows: { id: string; title: string; body: string; created_at: string }[] = [];
  for (let id = cursorId - 1; id >= 1 && rows.length < limit; id--) {
    rows.push({
      id: noteId(id),
      title: `qualification-note-${id}`,
      body: '&<>"'.repeat(2_500),
      created_at: new Date(Date.UTC(2026, 7, 23) + id * 1_000).toISOString(),
    });
  }
  return rows;
}

function qualificationSession(accessToken: string) {
  const timestamp = new Date().toISOString();
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3_600,
    expires_at: Math.floor(Date.now() / 1_000) + 3_600,
    refresh_token: 'qualification-refresh-token',
    user: {
      id: USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'qualification@example.test',
      email_confirmed_at: timestamp,
      confirmed_at: timestamp,
      last_sign_in_at: timestamp,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: timestamp,
      updated_at: timestamp,
      is_anonymous: false,
    },
  };
}

function startSupabaseFixture(port: number) {
  const now = Math.floor(Date.now() / 1_000);
  const accessToken = [
    base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    base64Url(JSON.stringify({
      sub: USER_ID,
      role: 'authenticated',
      aud: 'authenticated',
      exp: now + 3_600,
    })),
    'qualification-signature',
  ].join('.');
  const session = qualificationSession(accessToken);
  const stats = {
    authRequests: 0,
    recordRequests: 0,
    noteRequests: 0,
    rejectedWorkspaceFilters: 0,
  };
  const server = Deno.serve({ hostname: '127.0.0.1', port, onListen() {} }, (request) => {
    const url = new URL(request.url);
    const authorization = request.headers.get('authorization');
    if (authorization !== `Bearer ${accessToken}`) {
      return Response.json({ message: 'invalid qualification token' }, { status: 401 });
    }
    if (url.pathname === '/auth/v1/user') {
      stats.authRequests++;
      return Response.json(session.user);
    }
    if (url.pathname === '/rest/v1/workspace_records') {
      stats.recordRequests++;
      if (url.searchParams.get('workspace_id') !== `eq.${WORKSPACE_ID}`) {
        stats.rejectedWorkspaceFilters++;
      }
      const rows = workspaceRows(url);
      return Response.json(rows, {
        headers: { 'content-range': rows.length ? `0-${rows.length - 1}/*` : '*/0' },
      });
    }
    if (url.pathname === '/rest/v1/notes') {
      stats.noteRequests++;
      const rows = noteRows(url);
      return Response.json(rows, {
        headers: { 'content-range': rows.length ? `0-${rows.length - 1}/*` : '*/0' },
      });
    }
    return Response.json({ message: 'not found' }, { status: 404 });
  });
  const cookie = `sb-127-auth-token=base64-${base64Url(JSON.stringify(session))}`;
  return { server, cookie, accessToken, stats };
}

interface CapturedProcess {
  child: Deno.ChildProcess;
  status: Promise<Deno.CommandStatus>;
  output(): string;
  drained: Promise<void>;
}

function captureProcess(child: Deno.ChildProcess): CapturedProcess {
  let output = '';
  const collect = async (stream: ReadableStream<Uint8Array>, label: string) => {
    const decoder = new TextDecoder();
    for await (const chunk of stream) {
      output += `${label}${decoder.decode(chunk, { stream: true })}`;
      if (output.length > 64_000) output = output.slice(-64_000);
    }
    output += decoder.decode();
  };
  const drained = Promise.all([
    collect(child.stdout, 'stdout: '),
    collect(child.stderr, 'stderr: '),
  ]).then(() => {});
  return { child, status: child.status, output: () => output, drained };
}

async function waitForRuntime(runtime: CapturedProcess, url: string, name: string) {
  for (let attempt = 0; attempt < 600; attempt++) {
    try {
      await fetch(url);
      return;
    } catch {
      // Startup races are expected while Node/workerd bind their ports.
    }
    const exited = await Promise.race([
      runtime.status.then((status) => status),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)),
    ]);
    if (exited) {
      await runtime.drained;
      throw new Error(`${name} exited during startup (${exited.code})\n${runtime.output()}`);
    }
  }
  throw new Error(`${name} did not become ready\n${runtime.output()}`);
}

async function stopRuntime(runtime: CapturedProcess | undefined) {
  if (!runtime) return;
  try {
    runtime.child.kill('SIGTERM');
  } catch {
    // Already exited.
  }
  await runtime.status;
  await runtime.drained;
}

function nextHref(html: string, id = 'next-page'): string {
  const anchor = new RegExp(`<a\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'iu').exec(html)?.[0];
  const href = anchor && /\bhref=["']([^"']+)["']/i.exec(anchor)?.[1];
  if (!href) throw new Error('qualification response omitted the next-page cursor');
  return href.replaceAll('&amp;', '&');
}

function assertPage(
  html: string,
  expectedRows: number,
  expected: string[],
  forbidden: string[] = [],
) {
  const rows = html.match(/<li\b/g)?.length ?? 0;
  if (rows !== expectedRows) {
    throw new Error(`qualification response rendered ${rows} rows instead of ${expectedRows}`);
  }
  for (const value of expected) {
    if (!html.includes(value)) throw new Error(`qualification response omitted ${value}`);
  }
  for (const value of forbidden) {
    if (html.includes(value)) throw new Error(`qualification response repeated ${value}`);
  }
}

async function qualifyRuntime(
  name: 'node-standalone' | 'wrangler-workerd',
  origin: string,
  cookie: string,
  accessToken: string,
) {
  const firstUrl = `${origin}/workspace-records?workspace=${WORKSPACE_ID}`;
  const latencies: number[] = [];
  let stableFirst = '';
  let stableSecond = '';
  let cacheControl: string | null = null;
  let contentType: string | null = null;
  let stableNotesFirst = '';
  let stableNotesSecond = '';
  for (let sample = 0; sample < SAMPLES; sample++) {
    const startedAt = performance.now();
    const first = await fetch(firstUrl, { headers: { cookie } });
    const firstHtml = await first.text();
    if (first.status !== 200) throw new Error(`${name} first page returned ${first.status}`);
    cacheControl = first.headers.get('cache-control');
    contentType = first.headers.get('content-type');
    if (!cacheControl?.startsWith('private')) {
      throw new Error(`${name} did not emit private cache control`);
    }
    if (!contentType?.includes('text/html')) throw new Error(`${name} did not emit HTML`);
    assertPage(firstHtml, 50, ['qualification-record-10001', 'qualification-record-9952']);

    const second = await fetch(new URL(nextHref(firstHtml), origin), { headers: { cookie } });
    const secondHtml = await second.text();
    if (second.status !== 200) throw new Error(`${name} second page returned ${second.status}`);
    assertPage(secondHtml, 50, ['qualification-record-9951', 'qualification-record-9902'], [
      'qualification-record-10001',
    ]);

    const notesFirst = await fetch(`${origin}/notes`, { headers: { cookie } });
    const notesFirstHtml = await notesFirst.text();
    if (notesFirst.status !== 200) {
      throw new Error(`${name} Notes first page returned ${notesFirst.status}`);
    }
    if (!notesFirst.headers.get('cache-control')?.startsWith('private')) {
      throw new Error(`${name} Notes did not emit private cache control`);
    }
    assertPage(notesFirstHtml, NOTES_PAGE_SIZE, [
      'qualification-note-10001',
      'qualification-note-9992',
    ]);
    if (notesFirstHtml.split(accessToken).length - 1 !== 1) {
      throw new Error(`${name} Notes did not emit exactly one JWT handoff`);
    }
    const notesSecond = await fetch(
      new URL(nextHref(notesFirstHtml, 'next-notes-page'), origin),
      { headers: { cookie } },
    );
    const notesSecondHtml = await notesSecond.text();
    assertPage(notesSecondHtml, NOTES_PAGE_SIZE, [
      'qualification-note-9991',
      'qualification-note-9982',
    ], [
      'qualification-note-10001',
    ]);
    if (notesSecondHtml.split(accessToken).length - 1 !== 1) {
      throw new Error(`${name} Notes second page did not emit exactly one JWT handoff`);
    }
    latencies.push(performance.now() - startedAt);
    if (stableFirst && (stableFirst !== firstHtml || stableSecond !== secondHtml)) {
      throw new Error(`${name} response changed across identical requests`);
    }
    stableFirst = firstHtml;
    stableSecond = secondHtml;
    if (
      stableNotesFirst &&
      (stableNotesFirst !== notesFirstHtml || stableNotesSecond !== notesSecondHtml)
    ) throw new Error(`${name} Notes response changed across identical requests`);
    stableNotesFirst = notesFirstHtml;
    stableNotesSecond = notesSecondHtml;
  }
  const firstBytes = new TextEncoder().encode(stableFirst).byteLength;
  const secondBytes = new TextEncoder().encode(stableSecond).byteLength;
  if (Math.max(firstBytes, secondBytes) > WORKSPACE_HTML_BUDGET_BYTES) {
    throw new Error(`${name} exceeded the ${WORKSPACE_HTML_BUDGET_BYTES}-byte HTML budget`);
  }
  const notesFirstBytes = new TextEncoder().encode(stableNotesFirst).byteLength;
  const notesSecondBytes = new TextEncoder().encode(stableNotesSecond).byteLength;
  if (Math.max(notesFirstBytes, notesSecondBytes) > NOTES_HTML_BUDGET_BYTES) {
    throw new Error(`${name} Notes exceeded the ${NOTES_HTML_BUDGET_BYTES}-byte HTML budget`);
  }
  latencies.sort((a, b) => a - b);
  return {
    runtime: name,
    status: 200,
    cacheControl,
    contentType,
    firstPageBytes: firstBytes,
    secondPageBytes: secondBytes,
    rowsPerPage: 50,
    datasetRows: TOTAL_ROWS,
    notes: {
      firstPageBytes: notesFirstBytes,
      secondPageBytes: notesSecondBytes,
      rowsPerPage: NOTES_PAGE_SIZE,
      datasetRows: TOTAL_ROWS,
      jwtHandoffs: 1,
    },
    p50TwoPageMs: Number(latencies[Math.floor(SAMPLES * 0.5)].toFixed(3)),
    p95TwoPageMs: Number(latencies[Math.floor(SAMPLES * 0.95)].toFixed(3)),
    html: { first: stableFirst, second: stableSecond },
  };
}

const fixturePort = reservePort();
const nodePort = reservePort();
const workersPort = reservePort();
const fixture = startSupabaseFixture(fixturePort);
const supabaseUrl = `http://127.0.0.1:${fixturePort}`;
const persistDirectory = await Deno.makeTempDir({ prefix: 'oe-workerd-' });
let nodeRuntime: CapturedProcess | undefined;
let workersRuntime: CapturedProcess | undefined;
try {
  nodeRuntime = captureProcess(new Deno.Command('node', {
    args: [NODE_ENTRY.pathname],
    cwd: STARTER.pathname,
    env: {
      OPEN_ELEMENT_HOST: '127.0.0.1',
      OPEN_ELEMENT_PORT: String(nodePort),
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: 'qualification-anon-key',
    },
    stdout: 'piped',
    stderr: 'piped',
  }).spawn());
  await waitForRuntime(nodeRuntime, `http://127.0.0.1:${nodePort}/`, 'Node standalone server');

  workersRuntime = captureProcess(new Deno.Command('deno', {
    args: [
      'run',
      '-A',
      'npm:wrangler@4.123.0',
      'dev',
      WORKERS_ENTRY.pathname,
      '--local',
      '--ip',
      '127.0.0.1',
      '--port',
      String(workersPort),
      '--compatibility-date',
      '2026-08-16',
      '--compatibility-flag',
      'nodejs_compat',
      '--persist-to',
      persistDirectory,
      '--var',
      `SUPABASE_URL:${supabaseUrl}`,
      '--var',
      'SUPABASE_ANON_KEY:qualification-anon-key',
      '--show-interactive-dev-session=false',
      '--log-level',
      'warn',
    ],
    cwd: ROOT.pathname,
    stdout: 'piped',
    stderr: 'piped',
  }).spawn());
  await waitForRuntime(workersRuntime, `http://127.0.0.1:${workersPort}/`, 'Wrangler/workerd');

  const node = await qualifyRuntime(
    'node-standalone',
    `http://127.0.0.1:${nodePort}`,
    fixture.cookie,
    fixture.accessToken,
  );
  const workers = await qualifyRuntime(
    'wrangler-workerd',
    `http://127.0.0.1:${workersPort}`,
    fixture.cookie,
    fixture.accessToken,
  );
  if (node.html.first !== workers.html.first || node.html.second !== workers.html.second) {
    throw new Error('Node and workerd emitted different workspace HTML');
  }
  if (
    fixture.stats.rejectedWorkspaceFilters !== 0 || fixture.stats.recordRequests !== SAMPLES * 4 ||
    fixture.stats.noteRequests !== SAMPLES * 4
  ) {
    throw new Error(`unexpected Supabase fixture calls: ${JSON.stringify(fixture.stats)}`);
  }

  const nodeVersion = new TextDecoder().decode(
    (await new Deno.Command('node', { args: ['--version'] }).output()).stdout,
  ).trim();
  console.log(JSON.stringify(
    {
      environment: {
        orchestrator: `Deno ${Deno.version.deno}`,
        node: nodeVersion,
        workers: 'Wrangler 4.123.0 local workerd',
      },
      samplesPerRuntime: SAMPLES,
      budgetBytes: {
        workspace: WORKSPACE_HTML_BUDGET_BYTES,
        notes: NOTES_HTML_BUDGET_BYTES,
      },
      fixture: { authenticated: true, datasetRows: TOTAL_ROWS, ...fixture.stats },
      results: [
        { ...node, html: undefined },
        { ...workers, html: undefined },
      ],
    },
    null,
    2,
  ));
} finally {
  await stopRuntime(workersRuntime);
  await stopRuntime(nodeRuntime);
  await fixture.server.shutdown();
  await Deno.remove(persistDirectory, { recursive: true });
}
