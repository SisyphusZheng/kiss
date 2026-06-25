/**
 * Bundle the SPA client into a single browser-compatible JS file.
 * Also copy CSS.
 */

import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["app/reader.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/client.js",
  platform: "browser",
  loader: { ".json": "json" },
});

await Deno.mkdir("dist/app", { recursive: true });
await Deno.copyFile("app/styles.css", "dist/app/styles.css");

console.log("[build:client] dist/client.js + dist/app/styles.css ready");
esbuild.stop();
