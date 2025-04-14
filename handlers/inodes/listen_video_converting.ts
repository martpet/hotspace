import { STATUS_CODE } from "@std/http";
import { HEADER } from "@std/http/unstable-header";
import { getPermissions } from "../../lib/util/file_permissions.ts";
import { isVideoNode } from "../../util/inodes/helpers.ts";
import type { Inode } from "../../util/inodes/types.ts";
import { keys as getInodeKey } from "../../util/kv/inodes.ts";
import { watch } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

export default function listenVideoConvertingHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { inodeId } = ctx.urlPatternResult.pathname.groups;

  if (!inodeId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const kvKey = getInodeKey.byId(inodeId);

  let kvReader:
    | ReadableStreamDefaultReader<[Deno.KvEntryMaybe<Inode>]>
    | undefined;

  const stream = new ReadableStream({
    start(controller) {
      kvReader = watch<[Inode]>([kvKey], async ([entry]) => {
        const inode = entry.value;
        const { canRead } = getPermissions({ user, resource: inode });
        if (!isVideoNode(inode) || !canRead) return;

        const {
          status,
          percentComplete,
          playlistDataUrl,
        } = inode.mediaConvert;

        const data = {
          status,
          percentComplete,
          playlistDataUrl,
        };

        const msg = `data: ${JSON.stringify(data)}\r\n\r\n`;
        controller.enqueue(new TextEncoder().encode(msg));

        if (status !== "PENDING") {
          await kvReader?.cancel();
          controller.close();
        }
      });
    },
    async cancel() {
      await kvReader?.cancel();
    },
  });

  ctx.resp.headers.set(HEADER.ContentType, "text/event-stream");

  return ctx.respond(stream);
}
