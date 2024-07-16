import type { Context } from "../lib/types.ts";
import { serveFile } from "file-server";

export default function staticRoute({ req, url }: Context) {
  return serveFile(req, "." + url.pathname);
}
