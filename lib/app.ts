import { serveFile } from "file-server";
import type { Context, Middleware, RouteHandler } from "./types.ts";
import { htmlDoc } from "../utils/htmlDoc.ts";

interface AppOptions {
  urlPatternHostname?: string;
  devHostname?: string;
}

export default class App {
  #routes: [URLPatternInput, RouteHandler][] = [];
  #middlewares: Middleware[] = [];
  #urlPatternHostname;
  #devHostname = "localhost";

  constructor(opt: AppOptions = {}) {
    this.#urlPatternHostname = opt.urlPatternHostname || "";
    if (opt.devHostname) this.#devHostname = opt.devHostname;
  }

  listen() {
    Deno.serve((req) => this.#mainHandler(req));
  }

  addRoute(patternInput: URLPatternInput, handler: RouteHandler) {
    this.#routes.push([patternInput, handler]);
  }

  addMiddleware(middleware: Middleware) {
    this.#middlewares.push(middleware);
  }

  async #mainHandler(req: Request) {
    const url = new URL(req.url);
    const isDev = url.hostname.endsWith(this.#devHostname);
    const ctx: Context = {
      req,
      url,
      isDev,
    };
    try {
      return await this.#router(ctx);
    } catch (err) {
      console.error(err);
      ctx.error = err;
      const error500 = (await import("../routes/_500.ts")).default;
      if (!error500) throw new Error(`Missing "../routes/_500.ts"`);
      return error500(ctx);
    }
  }

  async #router(ctx: Context) {
    if (ctx.url.pathname.startsWith("/static")) {
      const filePath = "." + ctx.url.pathname;
      return serveFile(ctx.req, filePath);
    }
    for (let [patternInput, handler] of this.#routes) {
      if (typeof patternInput === "string") {
        patternInput = { pathname: patternInput };
        if (!patternInput.hostname && this.#urlPatternHostname) {
          patternInput.hostname = this.#urlPatternHostname;
        }
      }
      const pattern = new URLPattern(patternInput);
      if (pattern.test(ctx.url.href)) {
        ctx.patternResult = pattern.exec(ctx.url);
        const respOrString = await handler(ctx);
        if (typeof respOrString === "string") {
          return new Response(htmlDoc(respOrString), {
            headers: { "content-type": "text/html" },
          });
        }
        return respOrString;
      }
    }
    const error404 = (await import("../routes/_404.ts")).default;
    if (!error404) throw new Error(`Missing "../routes/_404.ts"`);
    return error404(ctx);
  }
}
