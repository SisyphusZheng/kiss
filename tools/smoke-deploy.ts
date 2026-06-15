/**
 * Post-deploy smoke test for the Cloudflare Pages site.
 *
 * Verifies that critical paths return HTTP 200 and that the HTML does not
 * contain the `[object Object]` rendering artifact.
 */

// If Cloudflare credentials are not present, deploy:pages is skipped and there
// is nothing to smoke-test. Exit successfully so local release runs without
// credentials do not fail. CI provides the credentials and will run the smoke.
const API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
const ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
if (!API_TOKEN || !ACCOUNT_ID) {
  console.log(
    '[smoke:deploy] CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not set; skipping deploy smoke.',
  );
  Deno.exit(0);
}

const BASE_URL = Deno.env.get('DEPLOY_SMOKE_BASE_URL') ?? 'https://openelement.pages.dev';
const PATHS = ['/', '/guide', '/blog'];

let failed = false;

for (const path of PATHS) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const text = await response.text();
    if (response.status !== 200) {
      console.error(`[smoke:deploy] ${url} returned ${response.status}`);
      failed = true;
      continue;
    }
    if (text.includes('[object Object]')) {
      console.error(`[smoke:deploy] ${url} contains [object Object]`);
      failed = true;
      continue;
    }
    console.log(`[smoke:deploy] ${url} OK`);
  } catch (error) {
    console.error(
      `[smoke:deploy] ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    failed = true;
  }
}

if (failed) {
  console.error('[smoke:deploy] Deploy smoke test failed.');
  Deno.exit(1);
}

console.log('[smoke:deploy] All deploy smoke checks passed.');
