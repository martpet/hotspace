import type { Context, Middleware, RouteHandler } from "./types.ts";
import { htmlDoc } from "../utils/htmlDoc.ts";

export default class App {
  #routes: [URLPatternInput, RouteHandler][] = [];
  #middlewares: Middleware[] = [];

  addRoute(patternInput: URLPatternInput, handler: RouteHandler) {
    this.#routes.push([patternInput, handler]);
  }

  addMiddleware(middleware: Middleware) {
    this.#middlewares.push(middleware);
  }

  listen() {
    Deno.serve(async (req) => {
      const url = new URL(req.url);
      const isDev = url.hostname.endsWith("localhost");
      const ctx: Context = { req, url, isDev };
      try {
        return await this.#mainHandler(ctx);
      } catch (err) {
        console.error(err);
        ctx.error = err;
        const { default: error500 } = await import("../routes/_500.ts");
        if (!error500) throw new Error(`Missing "../routes/_500.ts"`);
        return error500(ctx);
      }
    });
  }

  #mainHandler(ctx: Context) {
    return this.#router(ctx);
  }

  async #router(ctx: Context) {
    if (ctx.url.pathname.startsWith("/static")) {
      const { default: staticHandler } = await import("../routes/_static.ts");
      if (!staticHandler) throw new Error(`Missing "../routes/_static.ts"`);
      return staticHandler(ctx);
    }
    for (let [patternInput, routeHandler] of this.#routes) {
      if (typeof patternInput === "string") {
        patternInput = { pathname: patternInput };
      }
      const pattern = new URLPattern(patternInput);
      if (pattern.test(ctx.url.href)) {
        ctx.patternResult = pattern.exec(ctx.url);
        const respOrString = await routeHandler(ctx);
        if (typeof respOrString === "string") {
          return new Response(htmlDoc(respOrString), {
            headers: { "content-type": "text/html" },
          });
        }
        return respOrString;
      }
    }
    const { default: error404 } = await import("../routes/_404.ts");
    if (!error404) throw new Error(`Missing "../routes/_404.ts"`);
    return error404(ctx);
  }
}
