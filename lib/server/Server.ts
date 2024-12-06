import { LimitedMap } from "$util";
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
import { flashMiddleware } from "./flash_middleware.ts";
import { staticFilesHandler } from "./static_files_handler.ts";
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

export class Server {
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

  serve(
    options:
      | Deno.ServeTcpOptions
      | (Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem) = {},
  ) {
    Deno.serve(options, (req) => this.#serveHandler(req));
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

    // deno-lint-ignore no-this-alias
    const that = this;
    let rootDomainUrl;
    let scpNonce;

    const ctx: Context = {
      req,
      respOpt: { headers: new Headers() },
      state: {},
      handler: route.handler,
      url,
      urlPatternResult: route.patternResult,
      userAgent: new UserAgent(req.headers.get("user-agent")),
      locale: req.headers.get(HEADER.AcceptLanguage)?.split(",")[0],
      respond: (...x) => this.#createResponse(ctx, ...x),
      jsx: (...x) => this.#jsx(ctx, ...x),
      json: (...x) => this.#json(ctx, ...x),
      redirect: (...x) => this.#redirect(ctx, ...x),
      redirectBack: () => this.#redirectBack(ctx),
      setFlash: (...x) => this.#setFlash(ctx, ...x),
      get rootDomainUrl() {
        rootDomainUrl ??= that.#getRootDomainUrl(ctx);
        return rootDomainUrl;
      },
      get isLocalhostSafari() {
        return this.userAgent.browser.name === "Safari" &&
          this.url.hostname.endsWith("localhost");
      },
      get scpNonce() {
        scpNonce ??= crypto.randomUUID();
        return scpNonce;
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
  #getRootDomainUrl(ctx: Context): URL | undefined {
    const pattern = this.#rootHostnameURLPattern;
    if (!pattern) return;
    const url = new URL(ctx.url.origin);
    const match = new RegExp(pattern + "$").exec(ctx.url.hostname);
    if (!match) throw new Error("Root domain URL not found");
    url.hostname = match[0];
    return url;
  }

  #setFlash(ctx: Context, ...[flash]: Parameters<CtxFlashFn>) {
    if (!this.#middlewares.includes(flashMiddleware)) {
      throw new Error("Flash middleware is not added");
    }
    if (typeof flash === "string") {
      flash = { msg: flash, type: "success" };
    }
    setCookie(ctx.respOpt.headers, {
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
    if (status) ctx.respOpt.status = status;
    if (headers) {
      new Headers(headers).forEach((v, k) => ctx.respOpt.headers.set(k, v));
    }
    return new Response(body, ctx.respOpt);
  }

  #jsx(ctx: Context, ...[vnode]: Parameters<CtxJsxFn>) {
    ctx.respOpt.headers.set(HEADER.ContentType, contentType("html"));
    let html = renderToString(vnode, ctx);
    if (!ctx.respOpt.skipDosctype) html = "<!DOCTYPE html>" + html;
    return this.#createResponse(ctx, html);
  }

  #json(ctx: Context, ...[input, status]: Parameters<CtxJsonFn>) {
    ctx.respOpt.headers.set(HEADER.ContentType, contentType("json"));
    return this.#createResponse(ctx, JSON.stringify(input), status);
  }

  #redirect(ctx: Context, ...[path, status]: Parameters<CtxRedirectFn>) {
    ctx.respOpt.headers.set(HEADER.Location, path);
    ctx.respOpt.status = status || STATUS_CODE.SeeOther;
    return this.#createResponse(ctx, null);
  }

  #redirectBack(ctx: Context) {
    const path = ctx.req.headers.get(HEADER.Referer) || ctx.url.origin;
    return this.#redirect(ctx, path);
  }
}
