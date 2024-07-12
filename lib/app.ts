import { DOMParser } from "deno-dom";
import pretty from "pretty";
import type { Context, Middleware, RouteHandler } from "./types.ts";

interface AppOptions {
  htmlTemplateBuilder: (content: string) => string;
  errorHandler?: (ctx: Context) => Response | Promise<Response>;
  urlPatternHostname?: string;
}

export default class App {
  #routes: [URLPatternInput, RouteHandler][] = [];
  #middlewares: Middleware[] = [];
  #htmlTemplateBuilder;
  #errorHandler;
  #urlPatternHostname;

  constructor(opt: AppOptions) {
    this.#htmlTemplateBuilder = opt.htmlTemplateBuilder;
    this.#urlPatternHostname = opt.urlPatternHostname;
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
      buildHtmlDoc: this.#buildHtmlDoc.bind(this),
    };
    try {
      return await this.#applyMiddlewares(ctx);
    } catch (error) {
      if (this.#errorHandler) {
        console.error(error);
        ctx.error = error;
        return this.#errorHandler(ctx);
      } else {
        throw error;
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
      if (!patternInput.hostname && this.#urlPatternHostname) {
        patternInput.hostname = this.#urlPatternHostname;
      }
      const pattern = new URLPattern(patternInput);
      if (!pattern.test(ctx.url.href)) continue;
      ctx.urlPatternResult = pattern.exec(ctx.url);
      return this.#processRouteResult(await handler(ctx));
    }
    throw new Error("No route matched!");
  }

  #processRouteResult(routeResult: Response | string) {
    let resp = routeResult;
    if (typeof routeResult === "string") {
      resp = new Response(this.#buildHtmlDoc(routeResult));
      resp.headers.set("content-type", "text/html");
    } else if (!(resp instanceof Response)) {
      throw new Error(`Bad route response type: "${typeof resp}"`);
    }
    return resp;
  }

  #buildHtmlDoc(content: string) {
    const template = this.#htmlTemplateBuilder(content);
    const doc = new DOMParser().parseFromString(template, "text/html");
    const docString = `<!DOCTYPE html>${doc.documentElement!.outerHTML}`;
    return pretty(docString, { ocd: true });
  }
}
