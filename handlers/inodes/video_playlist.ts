import { s3 } from "$aws";
import { getPermissions, parsePathname } from "$util";
import { DAY } from "@std/datetime";
import { STATUS_CODE } from "@std/http";
import { HEADER } from "@std/http/unstable-header";
import { getSigner } from "../../util/aws.ts";
import { INODES_BUCKET } from "../../util/consts.ts";
import { getFileNodeUrl, isVideoNode } from "../../util/inodes/helpers.ts";
import { getInodeById } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";

const cache = await caches.open("video-playlist");

export default async function videoPlaylistHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { inodeId, renditionIndex } = ctx.urlPatternResult.pathname.groups;

  if (!inodeId || typeof renditionIndex === "undefined") {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const [inodeEntry, cachedS3Resp] = await Promise.all([
    getInodeById(inodeId, { consistency: "eventual" }),
    cache.match(ctx.url),
  ]);

  const inode = inodeEntry.value;
  const { canRead } = getPermissions({ user, resource: inodeEntry.value });

  if (!inode || !isVideoNode(inode) || !canRead) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const s3Key = inode.mediaConvert.subPlaylistsS3Keys?.[Number(renditionIndex)];

  if (!s3Key) {
    return ctx.respond(null, STATUS_CODE.InternalServerError);
  }

  const resp = cachedS3Resp || await s3.getObject({
    s3Key,
    signer: getSigner(),
    bucket: INODES_BUCKET,
    accelerated: true,
  });

  if (!resp.ok) {
    return ctx.respond(null, STATUS_CODE.BadGateway);
  }

  if (!cachedS3Resp) {
    await cache.put(ctx.url, resp.clone());
  }

  const playlist = await resp.text();
  const lines = playlist.split("\n");
  const cachedLines: Record<string, string> = {};
  const segmentPathBase = parsePathname(s3Key).parentSegments?.join("/");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.endsWith(".ts")) continue;
    if (!cachedLines[line]) {
      const segmentS3Key = `${segmentPathBase}/${line}`;
      cachedLines[line] = await getFileNodeUrl(segmentS3Key, { expireIn: DAY });
    }
    lines[i] = cachedLines[line];
  }

  const playlistResult = lines.join("\n");

  ctx.resp.headers.set(
    HEADER.CacheControl,
    `public, max-age=${DAY * 365 / 1000}, immutable`,
  );

  return ctx.respond(playlistResult);
}
