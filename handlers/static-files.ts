import { serveFile } from "@std/http";
import { AppContext } from "../utils/types.ts";

export default function staticFilesHandler(ctx: AppContext) {
  return serveFile(ctx.req, "." + ctx.url.pathname);
}
