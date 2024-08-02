type State = {
  [k: string]: unknown;
};

export interface Context<S = State> {
  state: S;
  req: Request;
  url: URL;
  isDev: boolean;
  isHtmlRequest: boolean;
  urlPattern?: URLPattern;
  error?: Error;
}

export type Handler<S = State> = (
  ctx: Context<S>,
) => Response | Promise<Response>;

export type Middleware<S = State> = (
  ctx: Context<S>,
  next: () => ReturnType<Middleware>,
) => Response | Promise<Response>;

interface ServerOptions {
  errorHandler?: Handler;
  urlPatternHostname?: string;
}

export default class Server {
  #errorHandler;
  #urlPatternHostname;
  #routes: { urlPattern: URLPattern; handler: Handler }[] = [];
  #middlewares: Middleware[] = [];

  constructor(opt: ServerOptions) {
    this.#errorHandler = opt.errorHandler;
    this.#urlPatternHostname = opt.urlPatternHostname;
  }

  addRoute(input: URLPatternInput, handler: Handler) {
    if (typeof input === "string") {
      input = { pathname: input };
    }
    input.hostname ??= this.#urlPatternHostname;
    this.#routes.push({
      urlPattern: new URLPattern(input),
      handler,
    });
  }

  addMiddleware(middleware: Middleware) {
    this.#middlewares.push(middleware);
  }

  serve() {
    Deno.serve((req) => this.#handleServe(req));
  }

  async #handleServe(req: Request) {
    const ctx: Context = {
      state: {},
      req,
      url: new URL(req.url),
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

  #applyMiddlewares(handler: Handler, ctx: Context, index = 0) {
    if (index < this.#middlewares.length) {
      const next = () => this.#applyMiddlewares(handler, ctx, index + 1);
      return this.#middlewares[index](ctx, next);
    }
    return handler(ctx);
  }
}
