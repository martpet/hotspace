import { DOMParser } from "deno-dom";
import pretty from "pretty";

export function htmlPage(content: string) {
  const { documentElement } = new DOMParser().parseFromString(
    `<html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        <link rel="icon" href="/static/favicon.ico" />
      </head>
      ${content}
    </html>`,
    "text/html",
  );

  const htmlString = `<!DOCTYPE html>${documentElement!.outerHTML}`;
  const prettyHtml = pretty(htmlString, { ocd: true });
  return new Response(prettyHtml, { headers: { "content-type": "text/html" } });
}
