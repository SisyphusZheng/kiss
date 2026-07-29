import { assertEquals, assertRejects } from '@std/assert';
import { NpmViewError, prereleaseTag, verifyNpmRelease } from './npm-release-verifier.ts';

Deno.test('verifyNpmRelease retries transient registry misses and verifies the matching tag', async () => {
  const calls: string[] = [];
  const sleeps: number[] = [];
  let misses = 2;

  await verifyNpmRelease({
    version: '0.41.0-alpha.13',
    packages: ['element'],
    delaysMs: [0, 1, 2, 4, 8, 15],
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    query: (specifier, field) => {
      calls.push(`${specifier}:${field}`);
      if (misses-- > 0) {
        throw new NpmViewError('registry returned 404', true);
      }
      return Promise.resolve('0.41.0-alpha.13');
    },
  });

  assertEquals(calls, [
    '@openelement/element@0.41.0-alpha.13:version',
    '@openelement/element@0.41.0-alpha.13:version',
    '@openelement/element@0.41.0-alpha.13:version',
    '@openelement/element:dist-tags.alpha',
  ]);
  assertEquals(sleeps, [1, 2]);
});

Deno.test('verifyNpmRelease does not require latest === prerelease (#607)', async () => {
  // Prerelease only checks the alpha/beta/rc tag; latest may stay on stable.
  await verifyNpmRelease({
    version: '0.41.0-alpha.13',
    packages: ['element'],
    delaysMs: [0],
    sleep: () => Promise.resolve(),
    query: (_specifier, field) =>
      Promise.resolve(
        field === 'dist-tags.latest' ? '0.41.2' : '0.41.0-alpha.13',
      ),
  });
});

Deno.test('verifyNpmRelease reports the final observed state after exhausting retries', async () => {
  await assertRejects(
    () =>
      verifyNpmRelease({
        version: '0.41.0-alpha.13',
        packages: ['adapter-vite'],
        delaysMs: [0, 1, 2],
        sleep: () => Promise.resolve(),
        query: () => {
          throw new NpmViewError('npm error E404', true);
        },
      }),
    Error,
    '@openelement/adapter-vite version verification failed after 3 attempts',
  );
});

Deno.test('verifyNpmRelease does not retry malformed registry responses', async () => {
  let attempts = 0;
  await assertRejects(
    () =>
      verifyNpmRelease({
        version: '0.41.0-rc.1',
        packages: ['element'],
        delaysMs: [0, 1, 2],
        sleep: () => Promise.resolve(),
        query: () => {
          attempts++;
          throw new NpmViewError('unexpected npm JSON value', false);
        },
      }),
    NpmViewError,
    'unexpected npm JSON value',
  );
  assertEquals(attempts, 1);
});

Deno.test('prereleaseTag accepts alpha beta and rc lines', () => {
  assertEquals(prereleaseTag('1.2.3-alpha.4'), 'alpha');
  assertEquals(prereleaseTag('1.2.3-beta.4'), 'beta');
  assertEquals(prereleaseTag('1.2.3-rc.4'), 'rc');
});

Deno.test('prereleaseTag returns null for stable versions and rejects malformed ones', () => {
  assertEquals(prereleaseTag('0.41.0'), null);
  assertEquals(prereleaseTag('0.41.0-alpha.19'), 'alpha');
});

Deno.test('verifyNpmRelease verifies stable releases against latest only', async () => {
  const calls: string[] = [];
  await verifyNpmRelease({
    version: '0.41.0',
    packages: ['element'],
    delaysMs: [0],
    sleep: () => Promise.resolve(),
    query: (specifier, field) => {
      calls.push(`${specifier}:${field}`);
      return Promise.resolve('0.41.0');
    },
  });
  assertEquals(calls, [
    '@openelement/element@0.41.0:version',
    '@openelement/element:dist-tags.latest',
  ]);
});
