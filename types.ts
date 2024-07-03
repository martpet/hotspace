export interface Context {
  req: Request;
  url: URL;
  urlPattern?: URLPattern;
}

export type RouteHandler = (ctx: Context) =>
  | Response
  | Promise<Response>
  | string
  | Promise<string>;
