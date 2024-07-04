import type { Context, Middleware, RouteHandler } from "./types.ts";
import { htmlDoc } from "../utils/htmlDoc.ts";

const ERROR_404_PATH = "../routes/_404.ts";
const ERROR_500_PATH = "../routes/_500.ts";
const STATIC_HANDLER_PATH = "../routes/_static.ts";

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
        const { default: error500 } = await import(ERROR_500_PATH);
        if (!error500) throw new Error(`Missing "${ERROR_500_PATH}"`);
        return error500(ctx);
      }
    });
  }

  #mainHandler(ctx: Context) {
    return this.#router(ctx);
  }

  async #router(ctx: Context) {
    if (ctx.url.pathname.startsWith("/static")) {
      const { default: staticHandler } = await import(STATIC_HANDLER_PATH);
      if (!staticHandler) throw new Error(`Missing "${STATIC_HANDLER_PATH}"`);
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
    const { default: error404 } = await import(ERROR_404_PATH);
    if (!error404) throw new Error(`Missing "${ERROR_404_PATH}`);
    return error404(ctx);
  }
}
