export interface Context {
  req: Request;
  url: URL;
}

type Handler = (ctx: Context) =>
  | Response
  | Promise<Response>
  | string
  | Promise<string>;

export type RoutesHandlers = {
  [path: string]:
    | Handler
    | { [method: string]: Handler };
};
