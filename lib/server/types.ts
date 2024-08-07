export interface ServerOptions {
  errorHandler?: Handler;
  baseHostnameUrlPattern?: string;
}

type State = { [k: string]: unknown };

export interface Context<S = State> {
  req: Request;
  state: S;
  url: URL;
  urlPatternResult: URLPatternResult;
  isDev: boolean;
  isHtmlRequest: boolean;
  routeHandler: Handler<S>;
  error?: Error;
}

export type Handler<S = State> = (ctx: Context<S>) =>
  | Response
  | Promise<Response>;

export type Middleware<S = State> = (
  ctx: Context<S>,
  next: () => ReturnType<Middleware>,
) =>
  | Response
  | Promise<Response>;
