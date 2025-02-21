import type { AppContext } from "../util/types.ts";

export default function manifestJsonHandler(ctx: AppContext) {
  return ctx.json({
    "name": "HotSpace",
    "short_name": "HotSpace",
    "start_url": ctx.url.origin,
    "display": "standalone",
    "icons": [
      {
        "src": "/static/img/logo.png",
        "sizes": "512x512",
        "type": "image/png",
      },
      {
        "src": "/static/img/logo.png",
        "sizes": "192x192",
        "type": "image/png",
      },
    ],
  });
}
