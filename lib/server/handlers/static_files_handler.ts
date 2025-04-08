import { DAY } from "@std/datetime";
import { serveDir } from "@std/http";
import { HEADER } from "@std/http/unstable-header";
import { ASSET_CACHE_PARAM } from "../util/consts.ts";
import type { Context } from "../util/types.ts";

export async function staticFilesHandler(ctx: Context) {
  const resp = await serveDir(ctx.req, { quiet: true });

  if (ctx.url.searchParams.has(ASSET_CACHE_PARAM)) {
    resp.headers.set(
      HEADER.CacheControl,
      `public, max-age=${DAY * 359 / 1000}, immutable`,
    );
  }

  return ctx.respond(resp);
}
