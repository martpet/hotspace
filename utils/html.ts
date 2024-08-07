import { DOMParser } from "@b-fuze/deno-dom";
import pretty from "pretty";
import type { Context } from "../utils/types.ts";

export function htmlResp(html: string, { status = 200 } = {}) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parsedHtml = `<!DOCTYPE html>${doc.documentElement!.outerHTML}`;
  const prettyHtml = pretty(parsedHtml, { ocd: true });
  const headers = { "content-type": "text/html" };
  return new Response(prettyHtml, { status, headers });
}

type LayoutFn = (input: string, ctx: Context) => string | Promise<string>;

type LayoutInputFn = (
  ctx: Context,
) => string | Promise<string> | Response | Promise<Response>;

export function createHtmlHandler(layout: LayoutFn) {
  return (inputFn: LayoutInputFn) => async (ctx: Context) => {
    const input = await inputFn(ctx);
    if (input instanceof Response) return input;
    const html = await layout(input, ctx);
    return htmlResp(html);
  };
}
