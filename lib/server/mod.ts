import {
  HEADER,
  type Method,
  setCookie,
  STATUS_CODE,
  UserAgent,
} from "@std/http";
import { contentType } from "@std/media-types";
import { renderToString } from "preact-render-to-string";
import { FLASH_COOKIE, STATIC_FILES_PATH } from "./consts.ts";
import { staticFilesHandler } from "./handlers/index.ts";
import { flashMiddleware } from "./middlewares/index.ts";
import type {
  Context,
  CtxFlashFn,
  CtxJsonFn,
  CtxJsxFn,
  CtxRedirectFn,
  CtxRespondFn,
  Handler,
  Middleware,
  Route,
  RouteMatch,
  RouteMethod,
  ServerOptions,
  TrailingSlashMode,
} from "./types.ts";
import { LimitedMap } from "./util/index.ts";

export * from "./consts.ts";
export * from "./handlers/index.ts";
export * from "./middlewares/index.ts";
export type * from "./types.ts";
export * from "./util/index.ts";

export default class Server {
  #routes: Route[] = [];
  #middlewares: Middleware[] = [];
  #rootHostnameURLPattern: string | undefined;
  #trailingSlashMode: TrailingSlashMode;
  #matchedRoutes = new LimitedMap<string, RouteMatch>(1000);

  constructor(opt: ServerOptions = {}) {
    this.#rootHostnameURLPattern = opt.rootHostnameURLPattern;
    this.#trailingSlashMode = opt.trailingSlashMode || "never";
    this.get(`${STATIC_FILES_PATH}/*`, staticFilesHandler);
  }

  on(
    method: RouteMethod,
    patternInput: URLPatternInput,
    handler: Handler,
  ) {
    if (typeof patternInput === "string") {
      patternInput = { pathname: patternInput };
    }
    patternInput.hostname ??= this.#rootHostnameURLPattern;
    const pattern = new URLPattern(patternInput);
    this.#routes.push({ method, pattern, handler });
  }

  get(patternInput: URLPatternInput, handler: Handler) {
    this.on("GET", patternInput, handler);
  }

  post(patternInput: URLPatternInput, handler: Handler) {
    this.on("POST", patternInput, handler);
  }

  all(patternInput: URLPatternInput, handler: Handler) {
    this.on("*", patternInput, handler);
  }

  use(middleware: Middleware) {
    this.#middlewares.push(middleware);
  }

  serve() {
    Deno.serve((req) => this.#serveHandler(req));
  }

  #serveHandler(req: Request): Response | Promise<Response> {
    const url = new URL(req.url);
    const urlFixed = this.#fixTrailingSlash(url);
    if (urlFixed) {
      return Response.redirect(urlFixed, STATUS_CODE.PermanentRedirect);
    }
    const route = this.#matchRoute(req);
    if (!route) {
      return new Response("Not Found", { status: STATUS_CODE.NotFound });
    }
    const that = this;
    let rootDomain: URL | null;
    const ctx: Context = {
      req,
      res: { headers: new Headers() },
      state: {},
      handler: route.handler,
      url,
      urlPatternResult: route.patternResult,
      locale: req.headers.get(HEADER.AcceptLanguage)?.split(",")[0],
      respond: (...x) => this.#createResponse(ctx, ...x),
      jsx: (...x) => this.#jsx(ctx, ...x),
      json: (...x) => this.#json(ctx, ...x),
      redirect: (...x) => this.#redirect(ctx, ...x),
      redirectBack: () => this.#redirectBack(ctx),
      setFlash: (...x) => this.#setFlash(ctx, ...x),
      get rootDomainUrl() {
        if (rootDomain === undefined) rootDomain = that.#getRootDomain(ctx);
        return rootDomain;
      },
      get isLocalhostSafari() {
        return that.#checkLocalhostSafari(ctx);
      },
    };
    return this.#handleRoute(ctx);
  }

  #matchRoute(req: Request): RouteMatch | undefined {
    const method = req.method as Method;
    const cached = this.#matchedRoutes.get(method + req.url);
    if (cached) return cached;
    for (const route of this.#routes) {
      if (
        route.method === method ||
        route.method === "*" ||
        Array.isArray(route.method) && route.method.includes(method)
      ) {
        const patternResult = route.pattern.exec(req.url);
        if (patternResult) {
          const match = { patternResult, ...route };
          this.#matchedRoutes.set(method + req.url, match);
          return match;
        }
      }
    }
  }

  async #handleRoute(ctx: Context, i = 0): Promise<Response> {
    if (i < this.#middlewares.length) {
      const next = () => this.#handleRoute(ctx, i + 1);
      return this.#middlewares[i](ctx, next);
    }
    const resp = await ctx.handler(ctx);
    if (resp instanceof Response) return resp;
    return ctx.jsx(resp);
  }

  #fixTrailingSlash(url: URL): URL | undefined {
    const mode = this.#trailingSlashMode;
    if (url.pathname === "/" || mode === "mixed") return;
    const slash = url.pathname.endsWith("/");
    const fix = new URL(url);
    if (slash && mode === "never") {
      fix.pathname = url.pathname.slice(0, -1);
      return fix;
    } else if (!slash && mode === "always") {
      fix.pathname = url.pathname + "/";
      return fix;
    }
  }
  #getRootDomain(ctx: Context): URL | null {
    const pattern = this.#rootHostnameURLPattern;
    if (!pattern) return null;
    const url = new URL(ctx.url.origin);
    const match = new RegExp(pattern + "$").exec(ctx.url.hostname);
    if (!match) throw new Error("Root domain URL not found");
    url.hostname = match[0];
    return url;
  }

  #checkLocalhostSafari(ctx: Context): boolean {
    const { browser } = new UserAgent(ctx.req.headers.get("user-agent") ?? "");
    return browser.name === "Safari" && ctx.url.hostname.endsWith("localhost");
  }

  #setFlash(ctx: Context, ...[flash]: Parameters<CtxFlashFn>) {
    if (!this.#middlewares.includes(flashMiddleware)) {
      throw new Error("Flash middleware is not added");
    }
    if (typeof flash === "string") {
      flash = { msg: flash, type: "success" };
    }
    setCookie(ctx.res.headers, {
      name: FLASH_COOKIE,
      value: encodeURIComponent(JSON.stringify(flash)),
      domain: ctx.rootDomainUrl?.hostname,
      path: "/",
      secure: !ctx.isLocalhostSafari,
      httpOnly: true,
    });
  }

  #createResponse(ctx: Context, ...params: Parameters<CtxRespondFn>) {
    let [body, status, headers] = params;
    if (body instanceof Response) ({ body, status, headers } = body);
    if (status) ctx.res.status = status;
    if (headers) {
      new Headers(headers).forEach((v, k) => ctx.res.headers.set(k, v));
    }
    return new Response(body, ctx.res);
  }

  #jsx(ctx: Context, ...[vnode]: Parameters<CtxJsxFn>) {
    ctx.res.headers.set(HEADER.ContentType, contentType("html"));
    const html = "<!DOCTYPE html>" + renderToString(vnode, ctx);
    return this.#createResponse(ctx, html);
  }

  #json(ctx: Context, ...[input, status]: Parameters<CtxJsonFn>) {
    ctx.res.headers.set(HEADER.ContentType, contentType("json"));
    return this.#createResponse(ctx, JSON.stringify(input), status);
  }

  #redirect(ctx: Context, ...[path, status]: Parameters<CtxRedirectFn>) {
    ctx.res.headers.set(HEADER.Location, path);
    ctx.res.status = status || STATUS_CODE.SeeOther;
    return this.#createResponse(ctx, null);
  }

  #redirectBack(ctx: Context) {
    const path = ctx.req.headers.get(HEADER.Referer) || ctx.url.origin;
    return this.#redirect(ctx, path);
  }
}
