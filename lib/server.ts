type State = { [k: string]: unknown };

interface ServerOptions {
  errorHandler?: ServerHandler;
  urlPatternHostname?: string;
}

export interface ServerContext<S = State> {
  req: Request;
  state: S;
  url: URL;
  urlPattern: URLPattern;
  isDev: boolean;
  isHtmlRequest: boolean;
  error?: Error;
}

export type ServerHandler<S = State> = (ctx: ServerContext<S>) =>
  | Response
  | Promise<Response>;

export type ServerMiddleware<S = State> = (
  ctx: ServerContext<S>,
  next: () => ReturnType<ServerMiddleware>,
) =>
  | Response
  | Promise<Response>;

export default class Server {
  #errorHandler;
  #urlPatternHostname;
  #routes: { urlPattern: URLPattern; handler: ServerHandler }[] = [];
  #middlewares: ServerMiddleware[] = [];

  constructor(opt: ServerOptions) {
    this.#errorHandler = opt.errorHandler;
    this.#urlPatternHostname = opt.urlPatternHostname;
  }

  addRoute(input: URLPatternInput, handler: ServerHandler) {
    if (typeof input === "string") {
      input = { pathname: input };
    }
    input.hostname ??= this.#urlPatternHostname;
    this.#routes.push({
      urlPattern: new URLPattern(input),
      handler,
    });
  }

  addMiddleware(middleware: ServerMiddleware) {
    this.#middlewares.push(middleware);
  }

  serve() {
    Deno.serve((req) => this.#serveHandler(req));
  }

  async #serveHandler(req: Request) {
    const ctx: ServerContext = {
      req,
      state: {},
      url: new URL(req.url),
      urlPattern: new URLPattern({}),
      isDev: Deno.env.get("DENO_DEPLOYMENT_ID") === undefined,
      isHtmlRequest: !!req.headers.get("accept")?.includes("text/html"),
    };
    try {
      const route = this.#matchRoute(req.url);
      if (!route) throw new Error("No route matched");
      ctx.urlPattern = route.urlPattern;
      return await this.#applyMiddlewares(route.handler, ctx);
    } catch (err) {
      if (this.#errorHandler) {
        console.error(err);
        ctx.error = err;
        return this.#errorHandler(ctx);
      } else {
        throw err;
      }
    }
  }

  #matchRoute(url: string) {
    for (const route of this.#routes) {
      if (route.urlPattern.test(url)) return route;
    }
  }

  #applyMiddlewares(handler: ServerHandler, ctx: ServerContext, index = 0) {
    if (index < this.#middlewares.length) {
      const next = () => this.#applyMiddlewares(handler, ctx, index + 1);
      return this.#middlewares[index](ctx, next);
    }
    return handler(ctx);
  }
}
