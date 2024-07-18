import type { Context } from "../lib/app/types.ts";
import { serveFile } from "file-server";

export default function staticFilesRoute({ req, url }: Context) {
  return serveFile(req, "." + url.pathname);
}
