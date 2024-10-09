import { ASSET_CACHE_PARAM } from "$server";
import { DAY } from "@std/datetime/constants";
import { HEADER, serveDir } from "@std/http";
import type { Context } from "../types.ts";

export default async function staticFiles(ctx: Context) {
  const resp = await serveDir(ctx.req, { quiet: true });

  if (ctx.url.searchParams.has(ASSET_CACHE_PARAM)) {
    resp.headers.set(
      HEADER.CacheControl,
      `public, max-age=${DAY * 359 / 1000}, immutable`,
    );
  }

  return ctx.respond(resp);
}
