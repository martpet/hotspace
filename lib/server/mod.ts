import type { Context, Handler, Middleware, ServerOptions } from "./types.ts";

export * from "./types.ts";

export default class Server {
  #routes: { urlPattern: URLPattern; handler: Handler }[] = [];
  #middlewares: Middleware[] = [];
  #errorHandler;
  #baseHostnameUrlPattern;

  constructor(opt: ServerOptions) {
    this.#errorHandler = opt.errorHandler;
    this.#baseHostnameUrlPattern = opt.baseHostnameUrlPattern;
  }

  addRoute(input: URLPatternInput, handler: Handler) {
    if (typeof input === "string") {
      input = { pathname: input };
    }
    input.hostname ??= this.#baseHostnameUrlPattern;
    this.#routes.push({
      urlPattern: new URLPattern(input),
      handler,
    });
  }

  addMiddleware(middleware: Middleware) {
    this.#middlewares.push(middleware);
  }

  serve() {
    Deno.serve((req) => this.#serveHandler(req));
  }

  async #serveHandler(req: Request) {
    const ctx = {
      req,
      state: {},
      url: new URL(req.url),
      isDev: Deno.env.get("DENO_DEPLOYMENT_ID") === undefined,
      isHtmlRequest: !!req.headers.get("accept")?.includes("text/html"),
    };
    try {
      const route = this.#matchRoute(req.url);
      if (!route) throw new Error("No route matched");
      return await this.#applyMiddlewares(route.handler, {
        ...ctx,
        routeHandler: route.handler,
        urlPatternResult: route.patternResult,
      });
    } catch (error) {
      if (this.#errorHandler) {
        console.error(error);
        return this.#errorHandler({ ...ctx, error } as Context);
      } else {
        throw error;
      }
    }
  }

  #matchRoute(url: string) {
    for (const route of this.#routes) {
      const patternResult = route.urlPattern.exec(url);
      if (patternResult) return { ...route, patternResult };
    }
  }

  #applyMiddlewares(handler: Handler, ctx: Context, index = 0) {
    if (index < this.#middlewares.length) {
      const next = () => this.#applyMiddlewares(handler, ctx, index + 1);
      return this.#middlewares[index](ctx, next);
    }
    return handler(ctx);
  }
}
