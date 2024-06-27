import { serveFile } from "file-server";
import { resp404 } from "./helpers/resp404.ts";
import { routes } from "./routes/index.ts";
import { htmlPage } from "./helpers/htmlPage.ts";

export async function router(req: Request) {
  const { pathname } = new URL(req.url);

  if (pathname.startsWith("/static")) {
    return serveFile(req, "." + pathname);
  }

  const handler = routes[pathname];
  const ctx = { req };

  if (handler) {
    const resp = await handler(ctx);
    return typeof resp === "string" ? htmlPage(resp) : resp;
  }

  return resp404(ctx);
}
