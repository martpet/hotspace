import type { VNode } from "preact";

export interface ServerOptions {
  errorHandler?: ServerHandler;
  baseHostnameUrlPattern?: string;
}

// deno-lint-ignore no-explicit-any
type State = Record<string, any>;

export interface ServerContext<S = State> {
  req: Request;
  respOpt: ResponseInit | Record<string, never>;
  state: S;
  url: URL;
  urlPatternResult: URLPatternResult;
  isDev: boolean;
  isHtmlRequest: boolean;
  routeHandler: ServerHandler<S>;
  error?: Error;
}

export type ServerHandler<S = State> = (ctx: ServerContext<S>) =>
  | Response
  | VNode
  | Promise<Response | VNode>;

export type ServerMiddleware<S = State> = (
  ctx: ServerContext<S>,
  next: () => ReturnType<ServerMiddleware>,
) =>
  | Response
  | Promise<Response>;
