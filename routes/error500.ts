import type { Context } from "../lib/types.ts";
import { htmlDoc } from "../utils/htmlDoc.ts";

export function error500({ req, error }: Context) {
  if (!req.headers.get("accept")?.includes("text/html")) {
    return new Response(null, { status: 500 });
  }

  const html = `
    <h1>Error 500: Server Error</h1>
    <pre>${error?.message}<pre>
  `;

  return new Response(htmlDoc(html), {
    status: 500,
    headers: { "content-type": "text/html" },
  });
}
