# Dogfood performance evidence

Reviewed 2026-07-11. Run `deno task dogfood:evidence` to rebuild the website,
read the canonical BuildArtifacts, combine the checked 30-minute Mastodon
stress report, and write `dogfood-performance.json`.

The checked reference run used Deno 2.9.1 on macOS arm64: 210 generated pages,
20,997,239 HTML bytes, 1,652,424 emitted JavaScript bytes, and a 2,379 ms warm
local build. The 30-minute Mastodon workload completed 359 requests with zero
errors, 0-13 ms latency, and RSS moving from 39 MB to 25 MB.

These numbers are regression evidence, not cross-framework benchmarks. Local
hardware and caches vary; emitted JavaScript includes lazy island chunks and is
not the per-page transfer size. Desktop artifact size remains null when the host
does not produce a platform bundle. Reader and Mastodon are framework dogfood,
not separate products. Historical comparison starts with this alpha.7 baseline.
