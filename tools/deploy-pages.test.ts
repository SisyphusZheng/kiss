import { assertEquals, assertStringIncludes } from '@std/assert';

async function runDeploy(ci: boolean): Promise<{ code: number; stderr: string }> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-env', '--allow-run', 'tools/deploy-pages.ts'],
    env: {
      CI: ci ? 'true' : 'false',
      CLOUDFLARE_API_TOKEN: '',
      CLOUDFLARE_ACCOUNT_ID: '',
    },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return { code: output.code, stderr: new TextDecoder().decode(output.stderr) };
}

Deno.test('Pages deployment fails closed in CI when credentials are missing', async () => {
  const result = await runDeploy(true);
  assertEquals(result.code, 1);
  assertStringIncludes(result.stderr, 'cannot run');
});

Deno.test('Pages deployment may be explicitly skipped outside CI', async () => {
  const result = await runDeploy(false);
  assertEquals(result.code, 0);
  assertStringIncludes(result.stderr, 'Skipping explicit local deployment');
});
