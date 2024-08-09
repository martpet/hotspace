import type { VNode } from "preact";

export interface ServerOptions {
  errorHandler?: ServerHandler;
  rootDomainURLPattern?: string;
  trailingSlashMode?: "always" | "never" | "mixed";
}

// deno-lint-ignore no-explicit-any
type State = Record<string, any>;

export interface ServerContext<S = State> {
  handler: ServerHandler<S>;
  req: Request;
  respInit: ResponseInit | Record<string, never>;
  state: S;
  url: URL;
  urlPatternResult: URLPatternResult;
  get rootDomain(): URL;
  isDev: boolean;
  isHtmlRequest: boolean;
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
