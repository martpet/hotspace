import type { Middleware } from "../lib/types.ts";

export const exampleMiddleware: Middleware = async (_ctx, next) => {
  console.log("example middleware run BEFORE route handler");
  const resp = await next();
  console.log("example middleware run AFTER route handler");
  return resp;
};
