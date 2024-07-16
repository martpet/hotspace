import type { Context } from "../lib/types.ts";

export default function error404({ req, htmlDocument }: Context) {
  const acceptsHtml = req.headers.get("accept")?.includes("text/html");

  if (!acceptsHtml) {
    return new Response(null, { status: 404 });
  }
  const htmlDoc = htmlDocument(`
    <h1>Error 404: Not Found</h1>
  `);

  return new Response(htmlDoc, {
    status: 404,
    headers: { "content-type": "text/html" },
  });
}
