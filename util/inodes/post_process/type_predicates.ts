import type {
  Inode,
  PostProcessedFileNode,
  PostProcessedToVideo,
} from "../types.ts";

export function isPostProcessedFileNode(
  inode: Inode | null,
): inode is PostProcessedFileNode {
  return inode?.type === "file" && Boolean(inode.postProcess);
}

export function isPostProcessedToVideo(
  inode: Inode | null,
): inode is PostProcessedToVideo {
  return isPostProcessedFileNode(inode) &&
    inode.postProcess.proc === "aws_mediaconvert";
}
