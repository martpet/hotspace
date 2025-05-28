import { fileUrlToRelative, kvWatch, LimitedMap } from "$util";
import { getCookies, setCookie, STATUS_CODE, UserAgent } from "@std/http";
import { HEADER } from "@std/http/unstable-header";
import { type Method } from "@std/http/unstable-method";
import { contentType } from "@std/media-types";
import { renderToString } from "preact-render-to-string";
import { staticFilesHandler } from "./handlers/static_files_handler.ts";
import { FLASH_COOKIE } from "./util/consts.ts";
import type {
  Context,
  CtxFlashFn,
  CtxJsonFn,
  CtxJsxFn,
  CtxJsxFragmentFn,
  CtxKvWatchSseFnOptions,
  CtxRedirectFn,
  CtxRespondFn,
  CtxSseFn,
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
  #trailingSlash: TrailingSlashMode;
  #matchedRoutes = new LimitedMap<string, RouteMatch>(1000);

  constructor(opt: ServerOptions = {}) {
    this.#trailingSlash = opt.trailingSlash || "never";
  }

  on(
    method: RouteMethod,
    pattern: URLPatternInput,
    handler: Handler,
  ) {
    if (typeof pattern === "string") {
      pattern = { pathname: pattern };
    }
    this.#routes.push({
      method,
      pattern: new URLPattern(pattern),
      handler,
    });
  }

  get(pattern: URLPatternInput, handler: Handler) {
    this.on("GET", pattern, handler);
  }

  post(pattern: URLPatternInput, handler: Handler) {
    this.on("POST", pattern, handler);
  }

  delete(pattern: URLPatternInput, handler: Handler) {
    this.on("DELETE", pattern, handler);
  }

  all(pattern: URLPatternInput, handler: Handler) {
    this.on("*", pattern, handler);
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

    const route = this.matchRoute(req);

    if (!route) {
      return new Response("Not Found", { status: STATUS_CODE.NotFound });
    }

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
      respond: (...r) => Server.respond(ctx, ...r),
      respondJsx: (...r) => Server.respondJsx(ctx, ...r),
      respondJsxFragment: (...r) => Server.respondJsxFragment(ctx, ...r),
      respondJson: (...r) => Server.respondJson(ctx, ...r),
      respondSse: (...r) => Server.respondSse(ctx, ...r),
      respondKvWatchSse: (opt) => Server.respondKvWatchSse(ctx, opt),
      redirect: (...r) => Server.redirect(ctx, ...r),
      redirectBack: () => Server.redirectBack(ctx),
      setFlash: (...r) => Server.setFlash(ctx, ...r),
      get scpNonce() {
        scpNonce ??= crypto.randomUUID();
        return scpNonce;
      },
    };
    return this.#handleRoute(ctx);
  }

  matchRoute(req: Request): RouteMatch | undefined {
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
    return ctx.respondJsx(resp);
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

  static setFlash(ctx: Context, ...[flash]: Parameters<CtxFlashFn>) {
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

  static respond(ctx: Context, ...params: Parameters<CtxRespondFn>) {
    let [body, status, headers] = params;
    if (body instanceof Response) ({ body, status, headers } = body);
    if (status) ctx.resp.status = status;
    if (headers) {
      new Headers(headers).forEach((v, k) => ctx.resp.headers.set(k, v));
    }
    return new Response(body, ctx.resp);
  }

  static respondJsx(ctx: Context, ...[vnode]: Parameters<CtxJsxFn>) {
    let html = renderToString(vnode, ctx);
    if (!ctx.resp.skipDoctype) html = "<!DOCTYPE html>" + html;
    ctx.resp.headers.set(HEADER.ContentType, contentType("html"));
    return ctx.respond(html);
  }

  static respondJsxFragment(
    ctx: Context,
    ...rest: Parameters<CtxJsxFragmentFn>
  ) {
    ctx.resp.skipDoctype = true;
    return ctx.respondJsx(...rest);
  }

  static respondJson(ctx: Context, ...[input, status]: Parameters<CtxJsonFn>) {
    ctx.resp.headers.set(HEADER.ContentType, contentType("json"));
    return ctx.respond(JSON.stringify(input), status);
  }

  static respondSse(ctx: Context, ...[opt]: Parameters<CtxSseFn>) {
    const { onStart, onCancel } = opt;
    const stream = new ReadableStream({
      start(controller) {
        const sendMsg = (data: unknown) => {
          const msg = `data: ${JSON.stringify(data)}\r\n\r\n`;
          controller.enqueue(new TextEncoder().encode(msg));
        };
        onStart({
          controller,
          sendMsg,
          sendClose() {
            sendMsg({ close: true });
          },
        });
      },
      cancel: () => onCancel?.(),
    });
    ctx.resp.headers.set(HEADER.ContentType, "text/event-stream");
    return ctx.respond(stream);
  }

  static respondKvWatchSse<T extends unknown[]>(
    ctx: Context,
    ...[opt]: [CtxKvWatchSseFnOptions<T>]
  ) {
    const { kv, kvKeys, onEntries } = opt;
    let kvReader: ReadableStreamDefaultReader | undefined;
    return ctx.respondSse({
      onStart: (sseOpt) => {
        kvReader = kvWatch({
          kv,
          kvKeys,
          onEntries: (entries) => onEntries({ entries, ...sseOpt }),
        });
      },
      onCancel: () => kvReader?.cancel(),
    });
  }

  static redirect(ctx: Context, ...[path, status]: Parameters<CtxRedirectFn>) {
    ctx.resp.headers.set(HEADER.Location, path);
    ctx.resp.status = status || STATUS_CODE.SeeOther;
    return ctx.respond(null);
  }

  static redirectBack(ctx: Context) {
    const path = ctx.req.headers.get(HEADER.Referer) || ctx.url.origin;
    return ctx.redirect(path);
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
