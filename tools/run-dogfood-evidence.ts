import { join } from '@std/path';
import { formatJson } from '@openelement/element/build-utils';
import { readJson } from './lib/fs.ts';

const started = performance.now();
const build = new Deno.Command(Deno.execPath(), {
  args: ['task', 'build'],
  stdout: 'inherit',
  stderr: 'inherit',
});
const status = await build.spawn().status;
if (!status.success) throw new Error(`build failed with code ${status.code}`);
const buildTimeMs = Math.round(performance.now() - started);

type BuildArtifacts = {
  clientAssets: Array<{ fileName: string; sizeBytes: number }>;
  pages: Array<{ path: string; errors?: unknown[] }>;
};

const artifacts = await readJson<BuildArtifacts>('www/.openElement/build-artifacts.json');
const stress = JSON.parse(
  await Deno.readTextFile('examples/deno-desktop-mastodon/stress-report.json'),
);
const initialJavaScriptBytes = artifacts.clientAssets.reduce(
  (sum: number, asset: { fileName: string; sizeBytes: number }) =>
    asset.fileName.endsWith('.js') ? sum + asset.sizeBytes : sum,
  0,
);
function htmlPath(path: string): string {
  if (path === '/') return 'www/dist/index.html';
  const relative = path.replace(/^\//, '');
  const clean = join('www/dist', relative, 'index.html');
  try {
    Deno.statSync(clean);
    return clean;
  } catch {
    return join('www/dist', `${relative}.html`);
  }
}
const generatedHtmlBytes = artifacts.pages.reduce(
  (sum: number, page: { path: string }) => sum + Deno.statSync(htmlPath(page.path)).size,
  0,
);
const report = {
  schemaVersion: 1,
  measuredAt: new Date().toISOString(),
  environment: { deno: Deno.version.deno, os: Deno.build.os, arch: Deno.build.arch },
  web: {
    buildTimeMs,
    pages: artifacts.pages.length,
    generatedHtmlBytes,
    initialJavaScriptBytes,
  },
  mastodonStress: stress.summary,
  desktopArtifactBytes: null,
  limitations: [
    'Local results vary by hardware and cache state.',
    'Desktop artifact size is null when no platform bundle is produced on this host.',
    'Reader and Mastodon are framework dogfood, not separate product lines.',
  ],
};
await Deno.mkdir('docs/evidence', { recursive: true });
await Deno.writeTextFile(
  'docs/evidence/dogfood-performance.json',
  formatJson(report),
);
console.log(JSON.stringify(report, null, 2));
