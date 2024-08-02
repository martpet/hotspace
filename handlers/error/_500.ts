import { buildHtml } from "../../utils/html.ts";
import { Context } from "../../utils/types.ts";

export default function error500Handler(ctx: Context) {
  const { isHtmlRequest, isDev, error } = ctx;

  if (!isHtmlRequest) {
    return new Response("Server Error", { status: 500 });
  }

  const html = buildHtml(`
    <h1>Server Error</h1>
    ${isDev && `<pre>${error}</pre>`}
  `);

  return new Response(html, {
    status: 500,
    headers: { "content-type": "text/html" },
  });
}
