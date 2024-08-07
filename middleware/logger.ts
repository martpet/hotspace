import type { Middleware } from "../utils/types.ts";

export const logger: Middleware = async ({ req, url, isDev }, next) => {
  if (!isDev) {
    return next();
  }

  const begin = performance.now();
  const resp = await next();
  const end = performance.now();
  const duration = Math.round(begin - end);

  console.log(`[${req.method}] ${url.pathname} (${duration}ms)`);

  return resp;
};
