import type { Method, RedirectStatus, UserAgent } from "@std/http";
import type { VNode } from "preact";

export type TrailingSlashMode = "always" | "never" | "mixed";

export interface ServerOptions {
  rootHostnameURLPattern?: string;
  trailingSlashMode?: TrailingSlashMode;
}

export type ServerResponseInit = Omit<ResponseInit, "headers"> & {
  headers: Headers;
};

export type CtxJsxFn = (input: VNode) => Response;
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
  res: ServerResponseInit;
  state: S;
  url: URL;
  urlPatternResult: URLPatternResult;
  userAgent: UserAgent;
  locale?: string;
  flash?: Flash;
  setFlash: CtxFlashFn;
  handler: Handler;
  respond: CtxRespondFn;
  jsx: CtxJsxFn;
  json: CtxJsonFn;
  redirect: CtxRedirectFn;
  redirectBack: CtxRedirectBackFn;
  get rootDomainUrl(): URL | undefined;
  get isLocalhostSafari(): boolean;
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
