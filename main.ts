import { serveFile } from "file-server";
import { routes } from "./routes/index.ts";
import { error404 } from "./routes/_404.ts";
import { htmlPage } from "./helpers/htmlPage.ts";
import type { Context } from "./types.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname.startsWith("/static")) {
    return serveFile(req, "." + url.pathname);
  }

  const ctx: Context = { req, url };

  for (const [patternInput, handler] of routes) {
    const pattern = new URLPattern(patternInput, url.origin);
    if (pattern.test(url.href)) {
      ctx.urlPattern = pattern;
      const resp = await handler(ctx);
      return typeof resp === "string" ? htmlPage(resp) : resp;
    }
  }

  return error404(ctx);
});
