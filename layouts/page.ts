import { createHtmlHandler } from "../utils/html.ts";
import { AppContext } from "../utils/types.ts";
import { findBaseUrl } from "../utils/url.ts";

export const page = createHtmlHandler(pageLayout);

export function pageLayout(input: string, ctx: AppContext) {
  const baseUrl = findBaseUrl(ctx.url);
  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        ${baseUrl ? `<base href="${baseUrl}" />` : ""}
        <link href="/static/main.css" rel="stylesheet" />
        <link rel="icon" href="/static/favicon.ico" />
      </head>
      ${input}
    </html>`;
}
