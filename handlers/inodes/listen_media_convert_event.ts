import { STATUS_CODE } from "@std/http";
import { HEADER } from "@std/http/unstable-header";
import { getPermissions } from "../../lib/util/file_permissions.ts";
import type { VideoNode } from "../../util/inodes/types.ts";
import { keys as inodesKeys } from "../../util/kv/inodes.ts";
import { watch } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

export default function listenMediaConvertEventHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { inodeId } = ctx.urlPatternResult.pathname.groups;

  if (!inodeId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  let kvReader: ReadableStreamDefaultReader<[Deno.KvEntryMaybe<VideoNode>]>;
  const kvKey = inodesKeys.byId(inodeId);

  const resBody = new ReadableStream({
    start(controller) {
      kvReader = watch<[VideoNode]>([kvKey], ([{ value: inode }]) => {
        const { canRead } = getPermissions({ user, resource: inode });
        if (!inode || !canRead) return;
        const { status, percentComplete, playlistDataUrl } =
          inode.mediaConvert || { status: "PENDING" };
        const data = { status, percentComplete, playlistDataUrl };
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
