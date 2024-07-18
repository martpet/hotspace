export interface Context {
  req: Request;
  url: URL;
  isDev: boolean;
  htmlDoc: (content: string) => string;
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
