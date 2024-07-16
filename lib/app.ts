import type { Context, Middleware, RouteHandler } from "./types.ts";
import { DOMParser } from "deno-dom";
import pretty from "pretty";

interface AppOptions {
  htmlDocBuilder: (content: string) => string;
  serverErrorHandler?: (ctx: Context) => Response | Promise<Response>;
  hostnamePattern?: string;
}

export default class App {
  #htmlDocBuilder;
  #serverErrorHandler;
  #hostnamePattern;
  #routes: [URLPatternInput, RouteHandler][] = [];
  #middlewares: Middleware[] = [];

  constructor(opt: AppOptions) {
    this.#htmlDocBuilder = opt.htmlDocBuilder;
    this.#serverErrorHandler = opt.serverErrorHandler;
    this.#hostnamePattern = opt.hostnamePattern;
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
      htmlDocument: this.#buildHtmlDoc.bind(this),
    };
    try {
      return await this.#applyMiddlewares(ctx);
    } catch (err) {
      if (this.#serverErrorHandler) {
        console.error(err);
        ctx.error = err;
        return this.#serverErrorHandler(ctx);
      } else {
        throw err;
      }
    }
  }

  #applyMiddlewares(ctx: Context, index = 0) {
    if (index < this.#middlewares.length) {
      const next = () => this.#applyMiddlewares(ctx, index + 1);
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
      patternInput.hostname ??= this.#hostnamePattern;
      const urlPattern = new URLPattern(patternInput);
      if (!urlPattern.test(ctx.url.href)) {
        continue;
      }
      ctx.urlPatternResult = urlPattern.exec(ctx.url);
      return this.#processRouteResponse(await handler(ctx));
    }
    throw new Error("No route matched!");
  }

  #processRouteResponse(routeResponse: Response | string) {
    let resp = routeResponse;
    if (typeof routeResponse === "string") {
      resp = new Response(this.#buildHtmlDoc(routeResponse));
      resp.headers.set("content-type", "text/html");
    } else if (!(resp instanceof Response)) {
      throw new Error(`Bad route response type: "${typeof resp}"`);
    }
    return resp;
  }

  #buildHtmlDoc(htmlInput: string) {
    const htmlTemplate = this.#htmlDocBuilder(htmlInput);
    const htmlDoc = new DOMParser().parseFromString(htmlTemplate, "text/html");
    const html = `<!DOCTYPE html>${htmlDoc.documentElement!.outerHTML}`;
    return pretty(html, { ocd: true });
  }
}
