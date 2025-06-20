import type { KvWatchOptions, MaybePromise } from "$util";
import type { RedirectStatus, UserAgent } from "@std/http";
import type { Method } from "@std/http/unstable-method";
import type { VNode } from "preact";

export type TrailingSlashMode = "always" | "never" | "mixed";

export interface ServerOptions {
  trailingSlash?: TrailingSlashMode;
}

export type ResponseOptions = Omit<ResponseInit, "headers"> & {
  headers: Headers;
  skipDoctype?: boolean;
};

export type CtxJsxFn = (arg: VNode) => Response;
export type CtxJsxPartialFn = (arg: VNode) => Response;
export type CtxJsonFn = (arg: unknown, status?: number | null) => Response;
export type CtxSseFn = (arg: CtxSseFnOptions) => Response;
export type CtxKvWatchSseFn = <T extends unknown[]>(
  arg: CtxKvWatchSseFnOptions<T>,
) => Response;
export type CtxRedirectFn = (path: string, status?: RedirectStatus) => Response;
export type CtxRedirectBackFn = (opt?: CtxRedirectBackFnOptions) => Response;
export type CtxFlashFn = (arg: string | Flash) => void;

export type CtxRespondFn = (
  respOrBody?: Response | BodyInit | null,
  status?: number | null,
  headers?: HeadersInit,
) => Response;

interface CtxSseFnOptions {
  onStart: (arg: CtxSseOnStartOptions) => void;
  onCancel?: () => void;
}

interface CtxRedirectBackFnOptions {
  param?: Record<string, string>;
}

interface CtxSseOnStartOptions {
  sendMsg: (msg: unknown) => void;
  sendClose: () => void;
  controller: ReadableStreamDefaultController;
}

export type CtxKvWatchSseFnOptions<T extends unknown[]> = {
  kv: Deno.Kv;
  kvKeys: KvWatchOptions<T>["kvKeys"];
  onEntries: (
    arg: CtxSseOnStartOptions & {
      entries: Parameters<KvWatchOptions<T>["onEntries"]>[0];
    },
  ) => MaybePromise<void>;
};

export interface Flash {
  msg: string;
  type: "success" | "warning" | "error" | "info";
}

type State = Record<string, unknown>;

export interface Context<S = State> {
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
  respondJsx: CtxJsxFn;
  respondJsxPartial: CtxJsxPartialFn;
  respondJson: CtxJsonFn;
  respondSse: CtxSseFn;
  respondKvWatchSse: CtxKvWatchSseFn;
  redirect: CtxRedirectFn;
  redirectBack: CtxRedirectBackFn;
  get scpNonce(): string;
}

export type Handler<S = State> = (ctx: Context<S>) =>
  | Response
  | VNode
  | Promise<Response | VNode>;

export type Middleware<S = State> = (
  ctx: Context<S>,
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
