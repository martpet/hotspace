import type { Context } from "../lib/types.ts";

export default function error500({ req, error, isDev, buildHtmlDoc }: Context) {
  const acceptsHtml = req.headers.get("accept")?.includes("text/html");
  if (!acceptsHtml) {
    return new Response(null, { status: 500 });
  }
  const html = buildHtmlDoc(`
    <h1>Oops, server error!</h1>
    ${isDev ? `<pre>${error}</pre>` : ""}
  `);

  return new Response(html, {
    status: 500,
    headers: { "content-type": "text/html" },
  });
}
