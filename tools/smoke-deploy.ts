/**
 * Post-deploy smoke test for the Cloudflare Pages site.
 *
 * Verifies that critical paths return HTTP 200 and that the HTML does not
 * contain the `[object Object]` rendering artifact.
 */

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
