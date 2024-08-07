import { createHtmlHandler } from "../utils/html.ts";
import type { Context } from "../utils/types.ts";
import { pageLayout } from "./page.ts";

export const userPage = createHtmlHandler(userPageLayout);

function userPageLayout(input: string, ctx: Context) {
  const { username } = ctx.urlPatternResult.hostname.groups;

  const content = `
    <h1>${username}</h1>
    ${input}
  `;

  return pageLayout(content, ctx);
}
