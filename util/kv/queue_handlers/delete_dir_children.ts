import { deleteInodesComplete } from "../../inodes_helpers.ts";
import { listInodesEntriesByDir } from "../inodes.ts";

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
  const entries = await listInodesEntriesByDir(msg.dirId);
  return deleteInodesComplete(entries);
}
