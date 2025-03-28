import { pick } from "@std/collections";
import { HEADER, STATUS_CODE } from "@std/http";
import { getPermissions } from "../../lib/util/permissions.ts";
import { getInodeById, keys as inodesKeys } from "../../util/kv/inodes.ts";
import { watch } from "../../util/kv/kv.ts";
import type { AppContext, VideoNode } from "../../util/types.ts";

export default async function listenMediaConvertEventHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { inodeId } = ctx.urlPatternResult.pathname.groups;

  if (!inodeId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const inodeEntry = await getInodeById(inodeId, { consistency: "eventual" });
  const inode = inodeEntry.value;
  const { canRead } = getPermissions({ user, resource: inode });

  if (!inode || !canRead) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  let kvReader: ReadableStreamDefaultReader<[Deno.KvEntryMaybe<VideoNode>]>;
  const kvKey = inodesKeys.byId(inodeId);

  const resBody = new ReadableStream({
    start(controller) {
      kvReader = watch<[VideoNode]>([kvKey], ([entry]) => {
        if (!entry.value) return;
        const data = pick(entry.value.mediaConvert, [
          "status",
          "jobPercentComplete",
          "playlistDataUrl",
        ]);
        const msg = `data: ${JSON.stringify(data)}\r\n\r\n`;
        controller.enqueue(new TextEncoder().encode(msg));
      });
    },
    cancel() {
      kvReader.cancel();
    },
  });

  ctx.resp.headers.set(HEADER.ContentType, "text/event-stream");

  return ctx.respond(resBody);
}
