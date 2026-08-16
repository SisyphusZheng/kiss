/**
 * Tier-2 browser journey for the Supabase reference starter.
 *
 * The workflow supplies a disposable user's credentials and the provider
 * secrets through the runner environment. This script never prints or writes
 * those values; its report contains check names only.
 */
import { chromium } from 'npm:playwright@1.59.1';

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const baseUrl = required('SMOKE_BASE_URL');
const email = required('SMOKE_USER_EMAIL');
const password = required('SMOKE_USER_PASSWORD');
const userId = required('SMOKE_USER_ID');
const otherUserId = required('SMOKE_OTHER_USER_ID');
const supabaseUrl = required('SUPABASE_URL');
const anonKey = required('SUPABASE_ANON_KEY');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const runId = required('SMOKE_RUN_ID');
const resultsFile = required('SMOKE_RESULTS_FILE');

async function record(check: string): Promise<void> {
  await Deno.writeTextFile(
    resultsFile,
    `${JSON.stringify({ check, result: 'pass' })}\n`,
    { append: true },
  );
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors: string[] = [];
  let resolveRealtimeLeave!: () => void;
  const realtimeLeave = new Promise<void>((resolve) => {
    resolveRealtimeLeave = resolve;
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('websocket', (socket) => {
    socket.on('framesent', ({ payload }) => {
      if (typeof payload === 'string' && payload.includes('phx_leave')) {
        resolveRealtimeLeave();
      }
    });
  });

  await page.goto(`${baseUrl}/notes`);
  await page.getByText('Sign-in is required').waitFor({ state: 'visible' });
  await record('browser-anonymous-notes-denied');

  await page.goto(`${baseUrl}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await Promise.all([
    page.waitForURL(`${baseUrl}/notes`),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ]);
  await page.getByText(`signed-in:${email}`, { exact: true }).waitFor({ state: 'visible' });
  await record('browser-password-login-cookie-session');

  const createdMarker = `browser-created-${runId}`;
  await page.getByLabel('Title').fill('browser smoke');
  await page.getByLabel('Body').fill(createdMarker);
  await Promise.all([
    page.waitForURL(`${baseUrl}/notes`),
    page.getByRole('button', { name: 'Create note' }).click(),
  ]);
  await page.locator('#notes').getByText(createdMarker, { exact: true }).waitFor({
    state: 'visible',
  });
  await record('browser-note-create-prg-persistence');

  const live = page.locator('notes-live');
  await live.locator('#live-status').getByText('realtime: subscribed', { exact: true }).waitFor({
    state: 'visible',
    timeout: 20_000,
  });
  await record('browser-realtime-user-jwt-subscribed');

  const isolatedMarker = `browser-realtime-isolated-${runId}`;
  const otherUserInsert = await fetch(`${supabaseUrl}/rest/v1/notes`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: otherUserId,
      title: 'realtime isolation smoke',
      body: isolatedMarker,
    }),
  });
  if (!otherUserInsert.ok) {
    throw new Error(`Cross-user Realtime seed failed with HTTP ${otherUserInsert.status}`);
  }
  await page.waitForTimeout(2_000);
  if (await live.locator('#live-events').getByText(isolatedMarker, { exact: true }).count()) {
    throw new Error("Realtime isolation breach: owner received another user's INSERT");
  }
  await record('browser-realtime-cross-user-insert-denied');

  const realtimeMarker = `browser-realtime-${runId}`;
  const inserted = await fetch(`${supabaseUrl}/rest/v1/notes`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({ user_id: userId, title: 'realtime smoke', body: realtimeMarker }),
  });
  if (!inserted.ok) throw new Error(`Realtime seed failed with HTTP ${inserted.status}`);
  try {
    await live.locator('#live-events').getByText(realtimeMarker, { exact: true }).waitFor({
      state: 'visible',
      timeout: 20_000,
    });
  } catch (error) {
    throw new Error(
      'Realtime subscribed but the owner INSERT was not delivered; verify the committed ' +
        'supabase_realtime publication migration is applied to the target project.',
      { cause: error },
    );
  }
  await record('browser-realtime-insert-delivered');

  await context.setOffline(true);
  await live.locator('#live-status').getByText('realtime: offline', { exact: true }).waitFor({
    state: 'visible',
  });
  await context.setOffline(false);
  await live.locator('#live-status').getByText('realtime: subscribed', { exact: true }).waitFor({
    state: 'visible',
    timeout: 20_000,
  });
  const recoveredMarker = `browser-realtime-recovered-${runId}`;
  const recoveredInsert = await fetch(`${supabaseUrl}/rest/v1/notes`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      title: 'realtime recovery smoke',
      body: recoveredMarker,
    }),
  });
  if (!recoveredInsert.ok) {
    throw new Error(`Recovered Realtime seed failed with HTTP ${recoveredInsert.status}`);
  }
  await live.locator('#live-events').getByText(recoveredMarker, { exact: true }).waitFor({
    state: 'visible',
    timeout: 20_000,
  });
  await record('browser-realtime-offline-online-recovery-delivers');

  const refreshedSession = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!refreshedSession.ok) {
    throw new Error(`Realtime token refresh failed with HTTP ${refreshedSession.status}`);
  }
  const refreshedAccessToken = (await refreshedSession.json() as { access_token?: string })
    .access_token;
  if (!refreshedAccessToken) throw new Error('Realtime token refresh returned no access token');
  await live.evaluate(
    (element, token) => element.setAttribute('data-access-token', token),
    refreshedAccessToken,
  );

  const refreshedMarker = `browser-realtime-refreshed-${runId}`;
  const refreshedInsert = await fetch(`${supabaseUrl}/rest/v1/notes`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      title: 'realtime refreshed token smoke',
      body: refreshedMarker,
    }),
  });
  if (!refreshedInsert.ok) {
    throw new Error(`Refreshed-token Realtime seed failed with HTTP ${refreshedInsert.status}`);
  }
  await live.locator('#live-events').getByText(refreshedMarker, { exact: true }).waitFor({
    state: 'visible',
    timeout: 20_000,
  });
  await record('browser-realtime-refreshed-jwt-delivers');

  await live.evaluate((element) => element.remove());
  await Promise.race([
    realtimeLeave,
    page.waitForTimeout(10_000).then(() => {
      throw new Error('Removing the Realtime island did not send a channel leave frame');
    }),
  ]);
  await record('browser-realtime-removal-releases-channel');

  await page.goto(`${baseUrl}/admin`);
  await page.getByRole('heading', { name: 'Admin', exact: true }).waitFor({ state: 'visible' });
  await record('browser-app-metadata-admin-guard');

  await page.goto(`${baseUrl}/notes`);
  const accessToken = await page.locator('notes-live').getAttribute('data-access-token');
  if (!accessToken) throw new Error('Authenticated page did not expose a Realtime access token');
  const demoted = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ app_metadata: { role: 'member' } }),
  });
  if (!demoted.ok) throw new Error(`Role demotion failed with HTTP ${demoted.status}`);
  const deniedAdmin = await page.goto(`${baseUrl}/admin`);
  if (deniedAdmin?.status() !== 404) {
    throw new Error(`Demoted admin request returned HTTP ${deniedAdmin?.status() ?? 'none'}`);
  }
  await record('browser-role-change-invalidates-server-guard');

  const revoked = await fetch(`${supabaseUrl}/auth/v1/logout?scope=global`, {
    method: 'POST',
    headers: { apikey: anonKey, authorization: `Bearer ${accessToken}` },
  });
  if (!revoked.ok) throw new Error(`Global session revocation failed with HTTP ${revoked.status}`);
  await page.goto(`${baseUrl}/notes`);
  await page.getByText('Sign-in is required').waitFor({ state: 'visible' });
  await record('browser-global-revocation-denies-session');

  if (pageErrors.length > 0) {
    throw new Error(`Browser page errors: ${pageErrors.join('; ')}`);
  }
  console.log('Supabase browser journey passed (credentials and identifiers redacted).');
} finally {
  await browser.close();
}
