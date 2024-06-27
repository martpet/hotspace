export interface Context {
  req: Request;
}

export type RouteHandler = (ctx: Context) =>
  | Response
  | Promise<Response>
  | string
  | Promise<string>;
