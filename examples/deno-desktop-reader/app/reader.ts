import { createApp } from "./spa-lite.ts";
import { routes, setRouter } from "./routes.ts";

export function bootReader() {
  const app = createApp(routes);
  setRouter(app);
}

bootReader();
