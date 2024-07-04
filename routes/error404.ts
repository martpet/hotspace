import type { Context } from "../lib/types.ts";
import { htmlDoc } from "../utils/htmlDoc.ts";

export function error404({ req }: Context) {
  if (!req.headers.get("accept")?.includes("text/html")) {
    return new Response(null, { status: 404 });
  }

  const html = `<h1>Error 404: Page Not Found</h1>`;

  return new Response(htmlDoc(html), {
    status: 404,
    headers: { "content-type": "text/html" },
  });
}
