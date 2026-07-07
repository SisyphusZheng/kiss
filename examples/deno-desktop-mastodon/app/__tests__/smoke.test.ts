import { assertEquals } from '@std/assert';

async function waitForServer(port: number, timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/api/timeline`);
      if (res.status === 200) return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error(`Server did not start on port ${port} within ${timeoutMs}ms`);
}

Deno.test('server endpoints serve fixtures', async () => {
  const port = 18123;
  const command = new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'main.ts'],
    cwd: new URL('../../', import.meta.url).pathname,
    env: { PORT: String(port) },
    stdout: 'null',
    stderr: 'null',
  });
  const process = command.spawn();

  try {
    await waitForServer(port);

    const timeline = await fetch(`http://localhost:${port}/api/timeline`);
    assertEquals(timeline.status, 200);
    const timelineBody = await timeline.json();
    assertEquals(Array.isArray(timelineBody), true);

    const profile = await fetch(
      `http://localhost:${port}/api/profile/${encodeURIComponent('admin@mastodon.social')}`,
    );
    assertEquals(profile.status, 200);
    const profileBody = await profile.json();
    assertEquals(profileBody.username, 'admin');

    const status = await fetch(`http://localhost:${port}/api/status/111111111111111111`);
    assertEquals(status.status, 200);
    const statusBody = await status.json();
    assertEquals(statusBody.id, '111111111111111111');

    const spa = await fetch(`http://localhost:${port}/`);
    assertEquals(spa.status, 200);
    const spaBody = await spa.text();
    assertEquals(spaBody.includes('openElement Mastodon Desktop'), true);
  } finally {
    process.kill();
    await process.status;
  }
});
