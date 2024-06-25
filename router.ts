import { serveFile } from "file-server";
import { handlers } from "./handlers/index.ts";
import { error404 } from "./handlers/404.ts";
import page from "./util/page.ts";
import type { Context } from "./types.ts";

export async function router(ctx: Context) {
  const { req, url } = ctx;

  // Static files
  if (url.pathname.startsWith("/static")) {
    const filePath = `${Deno.cwd()}/${url.pathname}`;
    return serveFile(req, filePath);
  }

  // Routes
  let handler;
  const handlerOrObj = handlers[url.pathname];

  if (typeof handlerOrObj === "function") {
    handler = handlerOrObj;
  } else if (typeof handlerOrObj === "object") {
    handler = handlerOrObj[req.method];
  }

  if (handler) {
    const respOrHtml = await handler(ctx);
    if (typeof respOrHtml === "string") {
      return page(respOrHtml);
    }
    return respOrHtml;
  }

  // 404
  return error404(ctx);
}
