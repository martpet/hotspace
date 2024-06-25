export interface Context {
  req: Request;
  url: URL;
}

export type Handler = (ctx: Context) =>
  | Response
  | Promise<Response>
  | string
  | Promise<string>;

export type HandlersByPathname = {
  [pathname: string]:
    | Handler
    | { [requestMethod: string]: Handler };
};
