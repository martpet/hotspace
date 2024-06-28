import { htmlPage } from "../helpers/htmlPage.ts";
import type { Context } from "../types.ts";

export function error404(ctx: Context) {
  const accepts = ctx.req.headers.get("accept");

  if (!accepts?.includes("text/html")) {
    return new Response(null, { status: 404 });
  }

  const html = `<h1>Error: Page Not Found</h1>`;
  const resp = htmlPage(html);
  resp.headers.set("status", "404");
  return resp;
}
