import { serveFile } from "file-server";
import { routes } from "./routes/index.ts";
import { error404 } from "./routes/_404.ts";
import { htmlPage } from "./helpers/htmlPage.ts";
import type { Context } from "./types.ts";

Deno.serve(async (req) => {
  const { href, origin, pathname } = new URL(req.url);

  if (pathname.startsWith("/static")) {
    return serveFile(req, "." + pathname);
  }

  const ctx: Context = { req };

  for (const [route, handler] of Object.entries(routes)) {
    const pattern = new URLPattern(route, origin);
    if (pattern.test(href)) {
      ctx.params = pattern.exec(href)?.pathname.groups;
      const resp = await handler(ctx);
      return typeof resp === "string" ? htmlPage(resp) : resp;
    }
  }

  return error404(ctx);
});
