import { router } from "./router.ts";

Deno.serve((req) =>
  router({
    req,
    url: new URL(req.url),
  })
);
