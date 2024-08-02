import { buildHtml } from "../../utils/html.ts";
import { Context } from "../../utils/types.ts";

export default function error400Handler(ctx: Context) {
  const { isHtmlRequest } = ctx;

  if (!isHtmlRequest) {
    return new Response("Not Found", { status: 404 });
  }

  const html = buildHtml(`
    <h1>404 Not Found</h1>
  `);

  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html" },
  });
}
