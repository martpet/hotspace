import { getPermissions } from "$util";
import { STATUS_CODE } from "@std/http";
import { getPreviewInfo } from "../../util/inodes/inode_preview_info.ts";
import {
  isPostProcessedFileNode,
  isPostProcessedToVideo,
} from "../../util/inodes/post_process/type_predicates.ts";
import type { Inode } from "../../util/inodes/types.ts";
import { keys as getInodeKey } from "../../util/kv/inodes.ts";
import { kv } from "../../util/kv/kv.ts";
import type { AppContext } from "../../util/types.ts";

export default function listenPostsProcessingHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { inodeId } = ctx.urlPatternResult.pathname.groups;

  if (!inodeId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  return ctx.respondKvWatchSse<[Inode]>({
    kv,
    kvKeys: [getInodeKey.byId(inodeId)],
    onEntries: async ({ entries, sendMsg, sendClose }) => {
      const inode = entries[0].value;
      const perms = getPermissions({ user, resource: inode });

      if (!isPostProcessedFileNode(inode) || !perms.canRead) {
        sendClose();
        return;
      }

      const { status } = inode.postProcess;

      if (isPostProcessedToVideo(inode)) {
        sendMsg({
          status,
          percentComplete: inode.postProcess.percentComplete,
          videoUrl: inode.postProcess.playlistDataUrl,
        });
      } else {
        sendMsg({
          status,
          previewUrl: (await getPreviewInfo(inode))?.url,
          mimeType: inode.postProcess.previewMimeType,
        });
      }

      if (status !== "PENDING") {
        sendClose();
      }
    },
  });
}
