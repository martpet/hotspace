import { DOMParser } from "@b-fuze/deno-dom";
import pretty from "pretty";
import type { AppContext } from "../utils/types.ts";

interface ResponseOptions {
  status?: number;
  headers?: HeadersInit;
}

export function htmlResp(html: string, options: ResponseOptions = {}) {
  const { status = 200 } = options;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parsedHtml = `<!DOCTYPE html>${doc.documentElement!.outerHTML}`;
  const prettyHtml = pretty(parsedHtml, { ocd: true });
  const headers = new Headers(options.headers);
  headers.set("content-type", "text/html");
  return new Response(prettyHtml, { status, headers });
}

type LayoutFn = (input: string, ctx: AppContext) =>
  | string
  | Promise<string>;

type LayoutInputFn = (ctx: AppContext) =>
  | string
  | Promise<string>
  | Response
  | Promise<Response>;

export function createHtmlHandler(layoutFn: LayoutFn) {
  return (inputFn: LayoutInputFn) => async (ctx: AppContext) => {
    const input = await inputFn(ctx);
    if (input instanceof Response) return input;
    const html = await layoutFn(input, ctx);
    return htmlResp(html);
  };
}
