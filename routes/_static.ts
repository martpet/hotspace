import { serveFile } from "file-server";
import { Context } from "../lib/types.ts";

export default function staticFilesHandler({ req, url }: Context) {
  return serveFile(req, "." + url.pathname);
}
