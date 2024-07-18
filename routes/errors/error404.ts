import type { Context } from "../../lib/app/types.ts";

export default function error404({ req, htmlDoc }: Context) {
  const acceptsHtml = req.headers.get("accept")?.includes("text/html");

  if (!acceptsHtml) {
    return new Response(null, { status: 404 });
  }
  const html = htmlDoc(`
    <h1>Error 404: Not Found</h1>
  `);

  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html" },
  });
}
