import type { RedirectStatus, UserAgent } from "@std/http";
import type { Method } from "@std/http/unstable-method";
import type { VNode } from "preact";

export type TrailingSlashMode = "always" | "never" | "mixed";

export interface ServerOptions {
  rootHostnameURLPattern?: string;
  trailingSlash?: TrailingSlashMode;
}

export type ResponseOptions = Omit<ResponseInit, "headers"> & {
  headers: Headers;
  skipDoctype?: boolean;
};

export type CtxJsxFn = (input: VNode) => Response;
export type CtxJsxFragmentFn = (input: VNode) => Response;
export type CtxJsonFn = (input: unknown, status?: number | null) => Response;
export type CtxRedirectFn = (path: string, status?: RedirectStatus) => Response;
export type CtxRedirectBackFn = () => Response;
export type CtxFlashFn = (flash: string | Flash) => void;

export type CtxRespondFn = (
  respOrBody?: Response | BodyInit | null,
  status?: number | null,
  headers?: HeadersInit,
) => Response;

export interface Flash {
  msg: string;
  type: "success" | "warning" | "error";
}

export interface Context<S = Record<string, never>> {
  req: Request;
  resp: ResponseOptions;
  state: S;
  url: URL;
  urlPatternResult: URLPatternResult;
  cookies: Record<string, string>;
  userAgent: UserAgent;
  locale?: string;
  flash?: Flash;
  setFlash: CtxFlashFn;
  handler: Handler;
  respond: CtxRespondFn;
  jsx: CtxJsxFn;
  jsxFragment: CtxJsxFragmentFn;
  json: CtxJsonFn;
  redirect: CtxRedirectFn;
  redirectBack: CtxRedirectBackFn;
  get rootDomainUrl(): URL | undefined;
  get scpNonce(): string;
}

export type Handler<C = Context> = (ctx: C) =>
  | Response
  | VNode
  | Promise<Response | VNode>;

export type Middleware<C = Context> = (
  ctx: C,
  next: () => ReturnType<Middleware>,
) =>
  | Response
  | Promise<Response>;

export type RouteMethod = "*" | Method | Method[];

export interface Route {
  method: RouteMethod;
  pattern: URLPattern;
  handler: Handler;
}

export interface RouteMatch extends Route {
  patternResult: URLPatternResult;
}
