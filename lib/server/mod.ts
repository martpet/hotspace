import { renderToStaticMarkup } from "preact-render-to-string";
import type {
  ServerContext,
  ServerHandler,
  ServerMiddleware,
  ServerOptions,
} from "./types.ts";

export * from "./types.ts";

export default class Server {
  #routes: { urlPattern: URLPattern; handler: ServerHandler }[] = [];
  #middlewares: ServerMiddleware[] = [];
  #errorHandler;
  #baseHostnameUrlPattern;

  constructor(opt: ServerOptions) {
    this.#errorHandler = opt.errorHandler;
    this.#baseHostnameUrlPattern = opt.baseHostnameUrlPattern;
  }

  addRoute(input: URLPatternInput, handler: ServerHandler) {
    if (typeof input === "string") input = { pathname: input };
    input.hostname ??= this.#baseHostnameUrlPattern;
    const urlPattern = new URLPattern(input);
    this.#routes.push({ urlPattern, handler });
  }

  addMiddleware(middleware: ServerMiddleware) {
    this.#middlewares.push(middleware);
  }

  serve() {
    Deno.serve((req) => this.#serveHandler(req));
  }

  async #serveHandler(req: Request) {
    const baseContext = {
      req,
      respOpt: {},
      state: {},
      url: new URL(req.url),
      isDev: Deno.env.get("DENO_DEPLOYMENT_ID") === undefined,
      isHtmlRequest: !!req.headers.get("accept")?.includes("text/html"),
    };
    try {
      const route = this.#matchRoute(req.url);
      if (!route) {
        throw new Error("No route matched");
      }
      const ctx = {
        ...baseContext,
        routeHandler: route.handler,
        urlPatternResult: route.urlPatternResult,
      };
      return await this.#applyMiddlewares(route.handler, ctx);
    } catch (error) {
      if (this.#errorHandler) {
        console.error(error);
        const ctx = { ...baseContext, error } as ServerContext;
        return this.#handleHandler(this.#errorHandler, ctx);
      } else {
        throw error;
      }
    }
  }

  #matchRoute(url: string) {
    for (const route of this.#routes) {
      const urlPatternResult = route.urlPattern.exec(url);
      if (urlPatternResult) return { ...route, urlPatternResult };
    }
  }

  #applyMiddlewares(handler: ServerHandler, ctx: ServerContext, index = 0) {
    if (index >= this.#middlewares.length) {
      const next = () => this.#applyMiddlewares(handler, ctx, index + 1);
      return this.#middlewares[index](ctx, next);
    }
    return this.#handleHandler(handler, ctx);
  }

  async #handleHandler(handler: ServerHandler, ctx: ServerContext) {
    const respOrVnode = await handler(ctx);
    if (respOrVnode instanceof Response) return respOrVnode;
    const html = "<!DOCTYPE html>" + renderToStaticMarkup(respOrVnode);
    const resp = new Response(html, ctx.respOpt);
    resp.headers.set("content-type", "text/html");
    return resp;
  }
}
