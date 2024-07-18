import type { Context, Middleware, RouteHandler } from "./types.ts";
import { DOMParser } from "deno-dom";
import pretty from "pretty";

interface AppOptions {
  htmlTemplateBuilder: (content: string) => string;
  serverErrorHandler?: (ctx: Context) => Response | Promise<Response>;
  hostnamePattern?: string;
}

export default class App {
  #htmlTemplateBuilder;
  #serverErrorHandler;
  #hostnamePattern;
  #routes: [URLPatternInput, RouteHandler][] = [];
  #middlewares: Middleware[] = [];

  constructor(opt: AppOptions) {
    this.#htmlTemplateBuilder = opt.htmlTemplateBuilder;
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
      htmlDoc: this.#buildHtmlDoc.bind(this),
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
      const pattern = new URLPattern(patternInput);
      if (!pattern.test(ctx.url.href)) {
        continue;
      }
      ctx.urlPatternResult = pattern.exec(ctx.url);
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
    const template = this.#htmlTemplateBuilder(htmlInput);
    const doc = new DOMParser().parseFromString(template, "text/html");
    const html = `<!DOCTYPE html>${doc.documentElement!.outerHTML}`;
    return pretty(html, { ocd: true });
  }
}
