import { serveFile } from "@std/http";
import type { Context } from "../utils/types.ts";

export default function staticFilesHandler(ctx: Context) {
  return serveFile(ctx.req, "." + ctx.url.pathname);
}
