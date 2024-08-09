import type { Middleware } from "../utils/types.ts";

export const flash: Middleware = (_ctx, next) => {
  return next();
};
