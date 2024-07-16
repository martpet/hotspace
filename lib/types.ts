export interface Context {
  req: Request;
  url: URL;
  isDev: boolean;
  htmlDocument: (content: string) => string;
  urlPatternResult?: URLPatternResult | null;
  error?: Error;
}

export type RouteHandler = (ctx: Context) =>
  | Response
  | Promise<Response>
  | string
  | Promise<string>;

export type Middleware = (
  ctx: Context,
  next: () => Response | Promise<Response>,
) => Response | Promise<Response>;
