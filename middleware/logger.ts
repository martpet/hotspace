import type { AppMiddleware } from "../utils/types.ts";

export const logger: AppMiddleware = async ({ req, url }, next) => {
  if (url.hostname !== "localhost") {
    return next();
  }
  const startTime = performance.now();
  const resp = await next();

  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  console.log(`[${req.method}] "${url.pathname}" - ${duration} ms`);

  return resp;
};
