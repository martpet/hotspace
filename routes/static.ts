import { serveFile } from "file-server";
import type { Context } from "../lib/types.ts";

export default function serveStatic(ctx: Context) {
  return serveFile(ctx.req, "." + ctx.url.pathname);
}
