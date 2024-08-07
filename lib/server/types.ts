export interface ServerOptions {
  errorHandler?: ServerHandler;
  baseHostnameUrlPattern?: string;
}

type State = { [k: string]: unknown };

export interface ServerContext<S = State> {
  req: Request;
  state: S;
  url: URL;
  urlPatternResult: URLPatternResult;
  isDev: boolean;
  isHtmlRequest: boolean;
  routeHandler: ServerHandler;
  error?: Error;
}

export type ServerHandler<S = State> = (ctx: ServerContext<S>) =>
  | Response
  | Promise<Response>;

export type ServerMiddleware<S = State> = (
  ctx: ServerContext<S>,
  next: () => ReturnType<ServerMiddleware>,
) =>
  | Response
  | Promise<Response>;
