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
const supabaseUrl = required('SUPABASE_URL');
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
  page.on('pageerror', (error) => pageErrors.push(error.message));

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
  await live.locator('#live-events').getByText(realtimeMarker, { exact: true }).waitFor({
    state: 'visible',
    timeout: 20_000,
  });
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
  await record('browser-realtime-offline-online-recovery');

  await Promise.all([
    page.waitForURL(`${baseUrl}/login`),
    page.getByRole('button', { name: 'Sign out' }).click(),
  ]);
  await page.goto(`${baseUrl}/notes`);
  await page.getByText('Sign-in is required').waitFor({ state: 'visible' });
  await record('browser-logout-clears-session');

  if (pageErrors.length > 0) {
    throw new Error(`Browser page errors: ${pageErrors.join('; ')}`);
  }
  console.log('Supabase browser journey passed (credentials and identifiers redacted).');
} finally {
  await browser.close();
}
