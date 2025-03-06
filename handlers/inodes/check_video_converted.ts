import { pick } from "@std/collections";
import { HEADER, STATUS_CODE } from "@std/http";
import { keys as inodesKeys } from "../../util/kv/inodes.ts";
import { watch } from "../../util/kv/kv.ts";
import type { AppContext, VideoNode } from "../../util/types.ts";

export default function checkVideoConvertedHandler(ctx: AppContext) {
  const { inodeId } = ctx.urlPatternResult.pathname.groups;

  if (!inodeId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  ctx.resp.headers.set(HEADER.ContentType, "text/event-stream");

  const kvKey = inodesKeys.byId(inodeId);
  let kvReader: ReadableStreamDefaultReader<[Deno.KvEntryMaybe<VideoNode>]>;

  const resBody = new ReadableStream({
    start(controller) {
      kvReader = watch<[VideoNode]>([kvKey], ([kvEntry]) => {
        const inode = kvEntry.value;
        if (!inode) return;
        const data = pick(inode.mediaConvert, ["status", "jobPercentComplete"]);
        const msg = `data: ${JSON.stringify(data)}\r\n\r\n`;
        controller.enqueue(new TextEncoder().encode(msg));
      });
    },
    cancel() {
      kvReader.cancel();
    },
  });

  return ctx.respond(resBody);
}
