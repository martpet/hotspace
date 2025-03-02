import { getInodeById, setInode } from "../kv/inodes.ts";
import type { FileNode, Inode, VideoNode } from "../types.ts";

export function isPostProcessableUpload(inode: Inode) {
  return isVideoNode(inode);
}

export function isFileNodeWithManyS3Objects(inode: Inode) {
  return isVideoNode(inode);
}

export function isVideoNode(inode: Inode): inode is VideoNode {
  return (inode as FileNode).fileType.startsWith("video");
}

export async function updateInodeWithRetry<T extends Inode>(
  entry: Deno.KvEntryMaybe<Inode>,
  data: T,
) {
  if (!entry.value) return;
  let commit = { ok: false };
  let i = 0;
  while (!commit.ok) {
    if (i > 0) entry = await getInodeById(entry.value.id);
    if (!entry.value) return;
    const atomic = setInode(data);
    atomic.check(entry);
    commit = await atomic.commit();
    i++;
  }
}
