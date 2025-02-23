import type { AppContext } from "../util/types.ts";
import { asset } from "../util/url.ts";

export default function manifestJsonHandler(ctx: AppContext) {
  return ctx.json({
    "name": "HotSpace",
    "short_name": "HotSpace",
    "start_url": ctx.url.origin,
    "display": "standalone",
    "icons": [
      {
        "src": asset("img/logo.png"),
        "sizes": "512x512",
        "type": "image/png",
      },
      {
        "src": asset("img/logo.png"),
        "sizes": "192x192",
        "type": "image/png",
      },
    ],
  });
}
