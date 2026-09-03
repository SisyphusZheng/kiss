/**
 * Local release mutual exclusion (#1231 M14).
 *
 * CI serializes release operations through the `openelement-release`
 * concurrency group in .github/workflows/autoflow-release.yml, but nothing
 * stopped two LOCAL release invocations (release-prepare, publish-existing,
 * patch-release, release, release-record) from interleaving in one working
 * copy — both rewriting project-constants, evidence records and package
 * manifests mid-plan. This lock closes that gap deterministically: the lock
 * file is created with `createNew`, so exactly one contender wins and every
 * other exits with the holder's identity.
 *
 * The lock lives under the gitignored `.artifacts/` scratch dir so a held or
 * stale lock never dirties the worktree. A holder killed before releasing
 * leaves a stale lock: the next release fails closed and names the file to
 * remove — recovery is a deliberate human act, never silent lock-breaking.
 */

export const RELEASE_LOCK_PATH = '.artifacts/autoflow-release.lock';

export type ReleaseLock =
  | { acquired: true; release: () => Promise<void> }
  | { acquired: false; reason: string };

/**
 * Try to take the release lock at `lockPath` for `command`. Exactly one
 * concurrent caller acquires; the rest get `acquired: false` with the current
 * holder's recorded identity.
 */
export async function acquireReleaseLock(
  lockPath: string,
  command: string,
): Promise<ReleaseLock> {
  // The parent (.artifacts/) is gitignored scratch and may not exist yet.
  const parent = lockPath.slice(0, lockPath.lastIndexOf('/'));
  if (parent) await Deno.mkdir(parent, { recursive: true });
  let file: Deno.FsFile;
  try {
    file = await Deno.open(lockPath, { createNew: true, write: true });
  } catch (err) {
    if (err instanceof Deno.errors.AlreadyExists) {
      let holder = '<holder unreadable>';
      try {
        holder = (await Deno.readTextFile(lockPath)).trim();
      } catch {
        // The holder may be mid-write; the lock still stands.
      }
      return {
        acquired: false,
        reason: `another release operation holds the lock at ${lockPath} (${holder}). ` +
          'If no release is actually running, remove that stale lock file and retry.',
      };
    }
    throw err;
  }
  const holder = JSON.stringify({
    pid: Deno.pid,
    command,
    startedAt: new Date().toISOString(),
  });
  await file.write(new TextEncoder().encode(holder));
  file.close();
  let held = true;
  return {
    acquired: true,
    release: async () => {
      if (!held) return;
      held = false;
      await Deno.remove(lockPath).catch(() => {
        // Already gone (e.g. operator removed it); nothing to release.
      });
    },
  };
}

/**
 * Synchronously drop the lock at `lockPath` if held. Registered by the CLI on
 * `unload` so the `Deno.exit` paths inside the release plan still release.
 */
export function releaseLockSync(lockPath: string): void {
  try {
    Deno.removeSync(lockPath);
  } catch {
    // Never held or already released.
  }
}
