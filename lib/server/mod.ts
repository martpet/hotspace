import { renderToStaticMarkup } from "preact-render-to-string";
import type {
  ServerContext,
  ServerHandler,
  ServerMiddleware,
  ServerOptions,
} from "./types.ts";

export type * from "./types.ts";

export default class Server {
  #routes: { urlPattern: URLPattern; handler: ServerHandler }[] = [];
  #middlewares: ServerMiddleware[] = [];
  #errorHandler;
  #rootDomainURLPattern;
  #trailingSlashMode;

  constructor(opt: ServerOptions) {
    this.#errorHandler = opt.errorHandler;
    this.#rootDomainURLPattern = opt.rootDomainURLPattern;
    this.#trailingSlashMode = opt.trailingSlashMode || "never";
  }

  addRoute(input: URLPatternInput, handler: ServerHandler) {
    if (typeof input === "string") input = { pathname: input };
    input.hostname ??= this.#rootDomainURLPattern;
    const urlPattern = new URLPattern(input);
    this.#routes.push({ urlPattern, handler });
  }

  addMiddleware(middleware: ServerMiddleware) {
    this.#middlewares.push(middleware);
  }

  serve() {
    Deno.serve((req) => this.#handleRequest(req));
  }

  async #handleRequest(req: Request) {
    const url = new URL(req.url);
    const fixedTrailingSlash = this.#fixTrailingSlash(url);
    if (fixedTrailingSlash) return Response.redirect(fixedTrailingSlash, 308);
    const match = this.#matchRoute(req.url);
    if (!match) return new Response("404 Not Found", { status: 404 });
    const that = this;
    const ctx: ServerContext = {
      req,
      respInit: {},
      state: {},
      url,
      urlPatternResult: match.urlPatternResult,
      handler: match.handler,
      isDev: Deno.env.get("DENO_DEPLOYMENT_ID") === undefined,
      isHtmlRequest: !!req.headers.get("accept")?.includes("text/html"),
      get rootDomain() {
        return that.#getRootDomainUrl(url);
      },
    };
    try {
      return await this.#applyMiddlewares(ctx);
    } catch (error) {
      if (this.#errorHandler) {
        console.error(error);
        ctx.error = error;
        ctx.handler = this.#errorHandler;
        return this.#handleRoute(ctx);
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

  #applyMiddlewares(ctx: ServerContext, index = 0) {
    if (index >= this.#middlewares.length) {
      const next = () => this.#applyMiddlewares(ctx, index + 1);
      return this.#middlewares[index](ctx, next);
    }
    return this.#handleRoute(ctx);
  }

  async #handleRoute(ctx: ServerContext) {
    const respOrVnode = await ctx.handler(ctx);
    if (respOrVnode instanceof Response) return respOrVnode;
    const html = "<!DOCTYPE html>" + renderToStaticMarkup(respOrVnode, ctx);
    const resp = new Response(html, ctx.respInit);
    resp.headers.set("content-type", "text/html");
    return resp;
  }

  #getRootDomainUrl(url: URL) {
    const rootUrl = new URL(url.origin);
    const pattern = this.#rootDomainURLPattern;
    if (!pattern) return rootUrl;
    const match = new RegExp(pattern + "$").exec(url.hostname);
    if (!match) throw new Error("Root domain URL not found");
    rootUrl.hostname = match[0];
    return rootUrl;
  }

  #fixTrailingSlash(url: URL) {
    const mode = this.#trailingSlashMode;
    if (mode === "mixed" || url.pathname === "/") return;
    const fixedUrl = new URL(url);
    const hasSlash = url.pathname.endsWith("/");
    if (mode === "never" && hasSlash) {
      fixedUrl.pathname = url.pathname.slice(0, -1);
      return fixedUrl.href;
    } else if (mode === "always" && !hasSlash) {
      fixedUrl.pathname = url.pathname + "/";
      return fixedUrl.href;
    }
  }
}
