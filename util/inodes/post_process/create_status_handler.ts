import { getPermissions, type MaybePromise } from "$util";
import { STATUS_CODE } from "@std/http";
import { HEADER } from "@std/http/unstable-header";
import { keys as getInodeKey } from "../../kv/inodes.ts";
import { watch } from "../../kv/kv.ts";
import type { AppContext } from "../../types.ts";
import { isPostProcessedNode } from "../helpers.ts";
import type { Inode, PostProcessedFileNode } from "../types.ts";

export function createFileNodeProcessingStatusHandler(
  callback: (
    inode: PostProcessedFileNode,
    ctx: AppContext,
  ) => MaybePromise<Record<string, unknown> | null>,
) {
  return (ctx: AppContext) => {
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

          if (!isPostProcessedNode(inode) || !canRead) {
            await kvReader?.cancel();
            controller.close();
            return;
          }

          const { status } = inode.postProcess;
          const data = await callback(inode, ctx);

          if (data) {
            const msg = `data: ${JSON.stringify(data)}\r\n\r\n`;
            controller.enqueue(new TextEncoder().encode(msg));
          }

          if (!data || status !== "PENDING") {
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
  };
}
