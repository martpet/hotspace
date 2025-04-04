import { fileUrlToRelative, LimitedMap } from "$util";
import { getCookies, setCookie, STATUS_CODE, UserAgent } from "@std/http";
import { HEADER } from "@std/http/unstable-header";
import { type Method } from "@std/http/unstable-method";
import { contentType } from "@std/media-types";
import { renderToString } from "preact-render-to-string";
import { staticFilesHandler } from "./handlers/static_files_handler.ts";
import { flashMiddleware } from "./middleware/flash_middleware.ts";
import { FLASH_COOKIE } from "./util/consts.ts";
import type {
  Context,
  CtxFlashFn,
  CtxJsonFn,
  CtxJsxFn,
  CtxJsxFragmentFn,
  CtxRedirectFn,
  CtxRespondFn,
  Handler,
  Middleware,
  Route,
  RouteMatch,
  RouteMethod,
  ServerOptions,
  TrailingSlashMode,
} from "./util/types.ts";

export class Server {
  #routes: Route[] = [];
  #middlewares: Middleware[] = [];
  #rootHostnameURLPattern: string | undefined;
  #trailingSlash: TrailingSlashMode;
  #matchedRoutes = new LimitedMap<string, RouteMatch>(1000);

  constructor(opt: ServerOptions = {}) {
    this.#rootHostnameURLPattern = opt.rootHostnameURLPattern;
    this.#trailingSlash = opt.trailingSlash || "never";
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

  delete(patternInput: URLPatternInput, handler: Handler) {
    this.on("DELETE", patternInput, handler);
  }

  all(patternInput: URLPatternInput, handler: Handler) {
    this.on("*", patternInput, handler);
  }

  use(middleware: Middleware) {
    this.#middlewares.push(middleware);
  }

  serve(options?: Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem) {
    Deno.serve(options || {}, (req) => this.#serveHandler(req));
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
      resp: { headers: new Headers() },
      state: {},
      handler: route.handler,
      url,
      urlPatternResult: route.patternResult,
      userAgent: new UserAgent(req.headers.get("user-agent")),
      cookies: getCookies(req.headers),
      locale: req.headers.get(HEADER.AcceptLanguage)?.split(",")[0],
      respond: (...r) => this.#createResponse(ctx, ...r),
      jsx: (...r) => this.#jsx(ctx, ...r),
      jsxFragment: (...r) => this.#jsxFragment(ctx, ...r),
      json: (...r) => this.#json(ctx, ...r),
      redirect: (...r) => this.#redirect(ctx, ...r),
      redirectBack: () => this.#redirectBack(ctx),
      setFlash: (...r) => this.#setFlash(ctx, ...r),
      get rootDomainUrl() {
        rootDomainUrl ??= that.#getRootDomainUrl(ctx);
        return rootDomainUrl;
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
    const mode = this.#trailingSlash;
    if (url.pathname === "/" || mode === "mixed") return;
    const hasSlash = url.pathname.endsWith("/");
    const fix = new URL(url);
    if (hasSlash && mode === "never") {
      fix.pathname = url.pathname.slice(0, -1);
      return fix;
    } else if (!hasSlash && mode === "always") {
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
    setCookie(ctx.resp.headers, {
      name: FLASH_COOKIE,
      value: encodeURIComponent(JSON.stringify(flash)),
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "Strict",
    });
  }

  #createResponse(ctx: Context, ...params: Parameters<CtxRespondFn>) {
    let [body, status, headers] = params;
    if (body instanceof Response) ({ body, status, headers } = body);
    if (status) ctx.resp.status = status;
    if (headers) {
      new Headers(headers).forEach((v, k) => ctx.resp.headers.set(k, v));
    }
    return new Response(body, ctx.resp);
  }

  #jsx(ctx: Context, ...[vnode]: Parameters<CtxJsxFn>) {
    ctx.resp.headers.set(HEADER.ContentType, contentType("html"));
    let html = renderToString(vnode, ctx);
    if (!ctx.resp.skipDoctype) html = "<!DOCTYPE html>" + html;
    return this.#createResponse(ctx, html);
  }

  #jsxFragment(ctx: Context, ...rest: Parameters<CtxJsxFragmentFn>) {
    ctx.resp.skipDoctype = true;
    return this.#jsx(ctx, ...rest);
  }

  #json(ctx: Context, ...[input, status]: Parameters<CtxJsonFn>) {
    ctx.resp.headers.set(HEADER.ContentType, contentType("json"));
    return this.#createResponse(ctx, JSON.stringify(input), status);
  }

  #redirect(ctx: Context, ...[path, status]: Parameters<CtxRedirectFn>) {
    ctx.resp.headers.set(HEADER.Location, path);
    ctx.resp.status = status || STATUS_CODE.SeeOther;
    return this.#createResponse(ctx, null);
  }

  #redirectBack(ctx: Context) {
    const path = ctx.req.headers.get(HEADER.Referer) || ctx.url.origin;
    return this.#redirect(ctx, path);
  }

  static serveFileUrl(ctx: Context, fileUrl: string) {
    const relPath = fileUrlToRelative(fileUrl);
    const newUrl = new URL(relPath, ctx.url.origin);
    ctx.url = newUrl;
    ctx.req = new Request(newUrl.href, {
      method: ctx.req.method,
      headers: ctx.req.headers,
      body: ctx.req.body,
    });
    return staticFilesHandler(ctx);
  }
}
