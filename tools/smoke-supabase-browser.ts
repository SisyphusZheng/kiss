/**
 * Tier-2 browser journey for the Supabase reference starter.
 *
 * The workflow supplies a disposable user's credentials and the provider
 * secrets through the runner environment. This script never prints or writes
 * those values; its report contains check names only.
 */
import { chromium, type Locator } from 'npm:playwright@1.59.1';

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

/**
 * Seed a note via the service role until the subscribed island renders it.
 * postgres_changes has no backfill: an insert that lands while the
 * server-side binding is activating can be missed even after the join ack.
 * The island therefore reconciles a bounded durable snapshot as a fallback.
 * Re-seeding keeps the probe bounded while proving either notification or
 * reconciliation converges instead of trusting the SUBSCRIBED label alone.
 */
async function seedNoteUntilDelivered(
  live: Locator,
  marker: string,
  title: string,
): Promise<void> {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const insert = await fetch(`${supabaseUrl}/rest/v1/notes`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({ user_id: userId, title, body: marker }),
    });
    if (!insert.ok) throw new Error(`Realtime seed failed with HTTP ${insert.status}`);
    const delivered = await live
      .locator('#live-events')
      .getByText(marker, { exact: true })
      .waitFor({ state: 'visible', timeout: 7_000 })
      .then(() => true, () => false);
    if (delivered) return;
  }
  // Diagnostics for CI-only failures: is the island stuck pre-subscribe, or
  // subscribed-but-silent?
  const status = await live.locator('#live-status').innerText().catch(() => 'unreadable');
  const events = await live.locator('#live-events li').count().catch(() => -1);
  throw new Error(
    `Realtime seed "${marker}" was not delivered after 6 bounded attempts ` +
      `(island status: "${status}", live events rendered: ${events})`,
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
  // The SSR list item is `<li><strong>title</strong> — body</li>`: the marker
  // shares its <li> with the title, so exact-text matching can never hit it.
  // Match the list item that contains the marker instead.
  await page.locator('#notes li').filter({ hasText: createdMarker }).first().waitFor({
    state: 'visible',
  });
  await record('browser-note-create-prg-persistence');

  const duplicateMarker = `browser-duplicate-submit-${runId}`;
  await page.getByLabel('Title').fill('duplicate submit smoke');
  await page.getByLabel('Body').fill(duplicateMarker);
  await page.getByRole('button', { name: 'Create note' }).dblclick();
  await page.locator('#notes li').filter({ hasText: duplicateMarker }).first().waitFor({
    state: 'visible',
  });
  await page.waitForTimeout(1_000);
  const duplicateCount = await fetch(
    `${supabaseUrl}/rest/v1/notes?select=id&body=eq.${encodeURIComponent(duplicateMarker)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );
  if (!duplicateCount.ok) {
    throw new Error(`Duplicate-submit audit query failed with HTTP ${duplicateCount.status}`);
  }
  const duplicateRows = await duplicateCount.json() as unknown[];
  if (duplicateRows.length !== 1) {
    throw new Error(
      `Duplicate submission created ${duplicateRows.length} rows; ` +
        'the enhanced form guard (#564) should allow exactly one',
    );
  }
  await record('browser-duplicate-submit-creates-single-row');

  const live = page.locator('notes-live');
  await live.locator('#live-status').getByText('realtime: subscribed', { exact: true }).waitFor({
    state: 'visible',
    timeout: 20_000,
  });
  await record('browser-realtime-user-jwt-subscribed');

  const second = await browser.newContext();
  const secondPage = await second.newPage();
  secondPage.on('pageerror', (error) => pageErrors.push(error.message));
  try {
    await secondPage.goto(`${baseUrl}/login`);
    await secondPage.getByLabel('Email').fill(email);
    await secondPage.getByLabel('Password').fill(password);
    await Promise.all([
      secondPage.waitForURL(`${baseUrl}/notes`),
      secondPage.getByRole('button', { name: 'Sign in' }).click(),
    ]);
    const secondLive = secondPage.locator('notes-live');
    await secondLive.locator('#live-status').getByText('realtime: subscribed', { exact: true })
      .waitFor({ state: 'visible', timeout: 20_000 });

    const secondClientMarker = `browser-second-client-${runId}`;
    await page.getByLabel('Title').fill('second client smoke');
    await page.getByLabel('Body').fill(secondClientMarker);
    await Promise.all([
      page.waitForURL(`${baseUrl}/notes`),
      page.getByRole('button', { name: 'Create note' }).click(),
    ]);
    await page.locator('#notes li').filter({ hasText: secondClientMarker }).first().waitFor({
      state: 'visible',
    });
    await secondLive.locator('#live-events').getByText(secondClientMarker, { exact: true })
      .waitFor({ state: 'visible', timeout: 20_000 });
    await record('browser-realtime-second-client-receives-ui-insert');
  } finally {
    await second.close();
  }

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
  await seedNoteUntilDelivered(live, recoveredMarker, 'realtime recovery smoke');
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
  await seedNoteUntilDelivered(live, refreshedMarker, 'realtime refreshed token smoke');
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
  const refreshedLive = page.locator('notes-live');
  await refreshedLive.locator('#live-status').getByText('realtime: subscribed', { exact: true })
    .waitFor({ state: 'visible', timeout: 20_000 });
  if (await refreshedLive.getAttribute('data-access-token') !== null) {
    throw new Error('Realtime access token remained in the DOM after hydration');
  }
  await record('browser-realtime-jwt-erased-after-handoff');
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
    headers: { apikey: anonKey, authorization: `Bearer ${refreshedAccessToken}` },
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
