import type { AppMiddleware } from "../utils/types.ts";

export const session: AppMiddleware = (_ctx, next) => {
  return next();
};
