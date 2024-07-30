import type { Middleware } from "../lib/app/types.ts";

export const requestLogger: Middleware = async ({ req, url }, next) => {
  if (url.hostname !== "localhost") {
    return next();
  }
  const startTime = performance.now();
  const resp = await next();
  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  console.log(`${req.method} — ${url.pathname} — ${duration} ms`);

  return resp;
};
