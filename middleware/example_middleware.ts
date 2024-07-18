import type { Middleware } from "../lib/app/types.ts";

export const exampleMiddleware: Middleware = async (_ctx, next) => {
  console.log("example middleware BEFORE route handler");
  const resp = await next();
  console.log("example middleware AFTER route handler");
  return resp;
};
