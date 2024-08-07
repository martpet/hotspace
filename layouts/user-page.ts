import { docTitle } from "../snippets/doc-title.ts";
import { createHtmlHandler } from "../utils/html.ts";
import type { AppContext } from "../utils/types.ts";
import { pageLayout } from "./page.ts";

export const userPage = createHtmlHandler(userPageLayout);

function userPageLayout(input: string, ctx: AppContext) {
  const username = ctx.urlPatternResult.hostname.groups.username!;

  const content = `
    <head>
      <meta name="robots" content="noindex" />
      ${docTitle(username)}
    </head>
    <h1>${username}</h1>
    ${input}
  `;

  return pageLayout(content, ctx);
}
