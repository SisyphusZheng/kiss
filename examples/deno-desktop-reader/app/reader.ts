import { createApp } from "./spa-lite.ts";
import { routes } from "./routes.ts";

export function bootReader() {
  createApp(routes);
}
