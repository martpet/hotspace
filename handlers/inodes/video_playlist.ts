import { DAY } from "@std/datetime";
import { HEADER, STATUS_CODE } from "@std/http";
import { getFileNodeUrl } from "../../util/inodes/helpers.ts";
import type { AppContext } from "../../util/types.ts";

const cache = await caches.open("video-playlist");

export default async function videoPlaylistHandler(ctx: AppContext) {
  const { s3Key } = ctx.urlPatternResult.pathname.groups;

  if (!s3Key) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const fileNodeUrl = await getFileNodeUrl({ s3Key });
  const fileNodeUrlObj = new URL(fileNodeUrl);
  const normalizedFileNodeUrl = fileNodeUrlObj.origin + fileNodeUrlObj.pathname;
  const normalizedReq = new Request(normalizedFileNodeUrl);
  const cachedResp = await cache.match(normalizedReq);
  const resp = cachedResp || await fetch(fileNodeUrl);

  if (!resp.ok) {
    return ctx.respond(null, STATUS_CODE.BadGateway);
  }

  if (!cachedResp) {
    await cache.put(normalizedReq, resp.clone());
  }

  const playlist = await resp.text();
  const lines = playlist.split("\n");
  const cachedLines: Record<string, string> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.endsWith(".ts")) continue;
    cachedLines[line] ??= await getFileNodeUrl({
      s3Key: fileNodeUrlObj.pathname.replace("m3u8", "ts").substring(1),
    });
    lines[i] = cachedLines[line];
  }

  const editedPlaylist = lines.join("\n");

  ctx.resp.headers.set(
    HEADER.CacheControl,
    `public, max-age=${DAY * 365 / 1000}, immutable`,
  );

  return ctx.respond(editedPlaylist);
}
