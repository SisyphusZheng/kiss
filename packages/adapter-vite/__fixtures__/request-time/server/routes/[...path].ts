import { createOpenElementNitroHandler } from '../../../../src/nitro-mount.ts';
import { openElementHandler } from '../../dist/server/entry.js';

type CloudflareWorkerRequest = Request & {
  runtime?: { cloudflare?: { env?: Record<string, string> } };
};

// Nitro v3 is fetch-native: the route event's `req` is already a standard
// Request. The Workers env arrives on `req.runtime.cloudflare.env` (the h3 v2
// event itself has no `env` field), so the mount extracts it explicitly —
// the spike proved the generated entry only reads c.env when it is wired
// through this channel.
export default function openElementNitroRoute(event: { req: Request }) {
  const env = (event.req as CloudflareWorkerRequest).runtime?.cloudflare?.env;
  return createOpenElementNitroHandler({ handler: openElementHandler, env })(event);
}
