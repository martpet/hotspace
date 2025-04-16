import { type Context, Server } from "$server";

export function uploadWorkerHandler(ctx: Context) {
  const fileUrl = import.meta.resolve("../static/upload_worker.js");
  return Server.serveFileUrl(ctx, fileUrl);
}
