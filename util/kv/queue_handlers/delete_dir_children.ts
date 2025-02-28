import { deleteInodesFull } from "../../inodes/kv_wrappers.ts";
import { listInodesByDir } from "../inodes.ts";

export interface QueueMsgDeleteDirChildren {
  type: "delete-dir-children";
  dirId: string;
}

export function isDeleteDirChildren(
  msg: unknown,
): msg is QueueMsgDeleteDirChildren {
  const { type, dirId } = msg as Partial<
    QueueMsgDeleteDirChildren
  >;
  return typeof msg === "object" &&
    type === "delete-dir-children" &&
    typeof dirId === "string";
}

export async function handleDeleteDirChildren(msg: QueueMsgDeleteDirChildren) {
  const { dirId } = msg;
  const inodes = await listInodesByDir(dirId);
  return deleteInodesFull(inodes);
}
