import { DOMParser } from "@b-fuze/deno-dom";
import pretty from "pretty";

export function buildHtml(input: string) {
  const template = `
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        <meta name="robots" content="noindex" />
        <link href="/static/main.css" rel="stylesheet" />
        <link rel="modulepreload" href="/static/preact.js" />
        <link rel="icon" href="/static/favicon.ico" />
      </head>
      ${input}
    </html>
  `;
  const doc = new DOMParser().parseFromString(template, "text/html");
  const parsed = `<!DOCTYPE html>${doc.documentElement!.outerHTML}`;
  return pretty(parsed, { ocd: true });
}

export function htmlResp(input: string) {
  return new Response(buildHtml(input), {
    headers: { "content-type": "text/html" },
  });
}
