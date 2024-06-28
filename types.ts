export interface Context {
  req: Request;
  params?: URLPatternComponentResult["groups"];
}

export type RouteHandler = (ctx: Context) =>
  | Response
  | Promise<Response>
  | string
  | Promise<string>;
