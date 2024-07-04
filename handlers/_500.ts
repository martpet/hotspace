import type { Context } from "../lib/types.ts";
import { htmlDoc } from "../utils/htmlDoc.ts";

export default function error500({ req, url, error, isDev }: Context) {
  if (!req.headers.get("accept")?.includes("text/html")) {
    return new Response(null, { status: 500 });
  }

  const html = `
    <h1>Server Error</h1>
    ${isDev ? `<pre>${error}</pre>` : ""}
  `;

  return new Response(htmlDoc(html), {
    status: 500,
    headers: { "content-type": "text/html" },
  });
}
