export interface Context {
  req: Request;
  url: URL;
  patternResult?: URLPatternResult | null;
  error?: Error;
}

export type RouteHandler = (ctx: Context) =>
  | Response
  | Promise<Response>
  | string
  | Promise<string>;

export type Middleware = (ctx: Context) =>
  | Response
  | Promise<Response>;
