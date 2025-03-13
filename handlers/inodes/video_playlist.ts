import { s3 } from "$aws";
import { parsePathname } from "$util";
import { DAY } from "@std/datetime";
import { HEADER, STATUS_CODE } from "@std/http";
import { getSigner } from "../../util/aws.ts";
import { INODES_BUCKET } from "../../util/consts.ts";
import { getFileNodeUrl } from "../../util/inodes/helpers.ts";
import type { AppContext } from "../../util/types.ts";

const cache = await caches.open("video-playlist");

export default async function videoPlaylistHandler(ctx: AppContext) {
  const { s3Key } = ctx.urlPatternResult.pathname.groups;

  if (!s3Key) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const cachedS3Resp = await cache.match(ctx.url);

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
      cachedLines[line] = await getFileNodeUrl(segmentS3Key);
    }
    lines[i] = cachedLines[line];
  }

  ctx.resp.headers.set(
    HEADER.CacheControl,
    `public, max-age=${DAY * 365 / 1000}, immutable`,
  );

  return ctx.respond(lines.join("\n"));
}
