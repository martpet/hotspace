import { pageLayout } from "../../layouts/page.ts";
import { docTitle } from "../../snippets/doc-title.ts";
import { htmlResp } from "../../utils/html.ts";
import type { AppContext } from "../../utils/types.ts";

export default (ctx: AppContext) => {
  const { isHtmlRequest, isDev, error } = ctx;

  if (!isHtmlRequest) {
    return new Response(null, { status: 500 });
  }

  const title = "Error 500: Server Error";

  const html = `
    ${docTitle(title)}
    <h1>${title}</h1>
    ${isDev && `<pre>${error}</pre>`}
  `;

  return htmlResp(pageLayout(html, ctx), { status: 500 });
};
