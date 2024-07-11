import { DOMParser } from "deno-dom";
import pretty from "pretty";

export function htmlDoc(content: string) {
  const doc = new DOMParser().parseFromString(
    `<html>
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
  const html = `<!DOCTYPE html>${doc.documentElement!.outerHTML}`;
  return pretty(html, { ocd: true });
}
