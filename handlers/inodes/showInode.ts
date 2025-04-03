import type { AppContext } from "../../util/types.ts";
import showDirHandler from "./show_dir.tsx";
import showFileHandler from "./show_file.tsx";

export default function showInodeHandler(ctx: AppContext) {
  return ctx.url.pathname.endsWith("/")
    ? showDirHandler(ctx)
    : showFileHandler(ctx);
}
