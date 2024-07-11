import type { Context, Middleware, RouteHandler } from "./types.ts";
import { htmlDoc } from "../helpers/html_doc.ts";

interface AppOptions {
  errorHandler?: (ctx: Context) => Response | Promise<Response>;
  patternInputHostname?: string;
}

export default class App {
  #routes: [URLPatternInput, RouteHandler][] = [];
  #middlewares: Middleware[] = [];
  #errorHandler;
  #patternInputHostname;

  constructor(opt: AppOptions = {}) {
    this.#patternInputHostname = opt.patternInputHostname;
    this.#errorHandler = opt.errorHandler;
  }

  addRoute(pattern: URLPatternInput, handler: RouteHandler) {
    this.#routes.push([pattern, handler]);
  }

  addMiddleware(middleware: Middleware) {
    this.#middlewares.push(middleware);
  }

  listen() {
    Deno.serve((req) => this.#serve(req));
  }

  async #serve(req: Request) {
    const ctx: Context = {
      req,
      url: new URL(req.url),
      isDev: Deno.env.get("DENO_DEPLOYMENT_ID") === undefined,
    };
    try {
      return await this.#applyMiddleware(ctx);
    } catch (error) {
      if (this.#errorHandler) {
        ctx.error = error;
        console.error(error);
        return this.#errorHandler(ctx);
      } else {
        throw error;
      }
    }
  }

  #applyMiddleware(ctx: Context, index = 0) {
    if (index < this.#middlewares.length) {
      const next = () => this.#applyMiddleware(ctx, index + 1);
      return this.#middlewares[index](ctx, next);
    } else {
      return this.#handleRoute(ctx);
    }
  }

  async #handleRoute(ctx: Context) {
    for (let [patternInput, handler] of this.#routes) {
      if (typeof patternInput === "string") {
        patternInput = { pathname: patternInput };
      }
      if (!patternInput.hostname && this.#patternInputHostname) {
        patternInput.hostname = this.#patternInputHostname;
      }
      const pattern = new URLPattern(patternInput);
      if (!pattern.test(ctx.url.href)) continue;
      ctx.urlPatternResult = pattern.exec(ctx.url);
      let resp = await handler(ctx);
      if (typeof resp === "string") {
        resp = new Response(htmlDoc(resp));
        resp.headers.set("content-type", "text/html");
      } else if (!(resp instanceof Response)) {
        throw new Error(`Bad route response type: "${typeof resp}"`);
      }
      return resp;
    }
    throw new Error("No route matched!");
  }
}
