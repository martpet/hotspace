import { pageLayout } from "../../layouts/page.ts";
import { docTitle } from "../../snippets/doc-title.ts";
import { htmlResp } from "../../utils/html.ts";
import type { AppContext } from "../../utils/types.ts";

export default (ctx: AppContext) => {
  if (!ctx.isHtmlRequest) {
    return new Response(null, { status: 404 });
  }

  const title = "Error 404: Page Not Found";

  const html = `
    ${docTitle(title)}
    <h1>${title}</h1>
  `;

  return htmlResp(pageLayout(html, ctx), { status: 404 });
};
