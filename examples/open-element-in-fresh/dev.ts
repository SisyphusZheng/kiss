#!/usr/bin/env -S deno run -A --watch=static/,routes/
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { Builder } from "$fresh/dev.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

const builder = new Builder({ manifest, config });
await builder.listen(import.meta.url);
