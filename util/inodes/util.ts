import { s3 } from "$aws";
import { getInodeById, setInode } from "../kv/inodes.ts";
import type { FileNode, Inode } from "../types.ts";

export function isPostProcessableUpload(upload: s3.CompletedMultipartUpload) {
  return upload.fileType.startsWith("video");
}

export function isFileNodeWithManyS3Objects(fileNode: FileNode) {
  return fileNode.fileType.startsWith("video");
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
