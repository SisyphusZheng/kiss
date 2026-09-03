import { assert, assertEquals } from '@std/assert';
import { acquireReleaseLock, RELEASE_LOCK_PATH, type ReleaseLock } from '../release-lock.ts';

function held(lock: ReleaseLock): { release: () => Promise<void> } {
  assert(lock.acquired, lock.acquired ? '' : lock.reason);
  return lock;
}

Deno.test('release lock: a second acquisition fails while the first is held', async () => {
  const dir = await Deno.makeTempDir();
  const lockPath = `${dir}/release.lock`;
  try {
    const first = held(await acquireReleaseLock(lockPath, 'release-prepare'));
    const second = await acquireReleaseLock(lockPath, 'publish-existing');
    assertEquals(second.acquired, false);
    if (!second.acquired) {
      assert(second.reason.includes(lockPath), second.reason);
      assert(second.reason.includes('release-prepare'), second.reason);
    }
    await first.release();
    const third = held(await acquireReleaseLock(lockPath, 'publish-existing'));
    await third.release();
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('release lock: stale lock from a dead holder is reported, not silently broken', async () => {
  const dir = await Deno.makeTempDir();
  const lockPath = `${dir}/release.lock`;
  try {
    await Deno.writeTextFile(lockPath, JSON.stringify({ pid: 999999, command: 'release' }));
    const attempt = await acquireReleaseLock(lockPath, 'release');
    assertEquals(attempt.acquired, false);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('release lock: double release is a no-op', async () => {
  const dir = await Deno.makeTempDir();
  const lockPath = `${dir}/release.lock`;
  try {
    const lock = held(await acquireReleaseLock(lockPath, 'release'));
    await lock.release();
    await lock.release();
    const again = held(await acquireReleaseLock(lockPath, 'release'));
    await again.release();
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('release lock: canonical path lives under the gitignored .artifacts dir', () => {
  assertEquals(RELEASE_LOCK_PATH, '.artifacts/autoflow-release.lock');
});
