/**
 * Deploy the built www/dist output to Cloudflare Pages.
 *
 * Expects environment variables:
 *   CLOUDFLARE_API_TOKEN
 *   CLOUDFLARE_ACCOUNT_ID
 *
 * When the variables are missing, the script exits successfully so that local
 * release runs without credentials do not fail. The actual deploy only happens
 * when both variables are present.
 */

const API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
const ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const PROJECT_NAME = Deno.env.get('CLOUDFLARE_PAGES_PROJECT') ?? 'openelement';
const DIST_DIR = 'www/dist';

if (!API_TOKEN || !ACCOUNT_ID) {
  console.log(
    '[deploy:pages] CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not set; skipping Pages deploy.',
  );
  Deno.exit(0);
}

const command = new Deno.Command(Deno.execPath(), {
  args: [
    'run',
    '-A',
    'npm:wrangler@3',
    'pages',
    'deploy',
    DIST_DIR,
    '--project-name',
    PROJECT_NAME,
    '--branch',
    'main',
  ],
  env: {
    CLOUDFLARE_API_TOKEN: API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
  },
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});

const status = await command.spawn().status;
if (!status.success) {
  console.error(`[deploy:pages] wrangler pages deploy failed with exit code ${status.code}`);
  Deno.exit(status.code);
}

console.log('[deploy:pages] Cloudflare Pages deploy completed.');
