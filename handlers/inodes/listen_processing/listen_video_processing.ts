import { pick } from "@std/collections";
import { isVideoNode } from "../../../util/inodes/helpers.ts";
import { createFileNodeProcessingStatusHandler } from "../../../util/inodes/post_process/create_status_handler.ts";

export default createFileNodeProcessingStatusHandler((inode) => {
  if (!isVideoNode(inode)) return null;

  return pick(inode.postProcess, [
    "status",
    "percentComplete",
    "playlistDataUrl",
  ]);
});
