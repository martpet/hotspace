import type { Context } from "../lib/types.ts";
import { htmlDoc } from "../helpers/html_doc.ts";

export default function error500({ req, error, isDev }: Context) {
  if (!req.headers.get("accept")?.includes("text/html")) {
    return new Response(null, { status: 500 });
  }
  const html = htmlDoc(`
    <h1>Oops, server error!</h1>
    ${isDev ? `<pre>${error}</pre>` : ""}
  `);

  return new Response(html, {
    status: 500,
    headers: { "content-type": "text/html" },
  });
}
