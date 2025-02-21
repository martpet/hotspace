import { deleteDirChildren } from "../../inodes_helpers.ts";
import { listInodesEntriesByDir } from "../inodes.ts";

export interface QueueMsgDeleteDirChildren {
  type: "delete-dir-children";
  dirId: string;
  pathSegments: string[];
  userId: string;
}

export function isDeleteDirChildren(
  msg: unknown,
): msg is QueueMsgDeleteDirChildren {
  const { type, dirId, pathSegments, userId } = msg as Partial<
    QueueMsgDeleteDirChildren
  >;
  return typeof msg === "object" &&
    type === "delete-dir-children" &&
    typeof dirId === "string" &&
    Array.isArray(pathSegments) &&
    typeof userId === "string";
}

export async function handleDeleteDirChildren(msg: QueueMsgDeleteDirChildren) {
  const entries = await listInodesEntriesByDir(msg.dirId);

  return deleteDirChildren({ ...msg, entries });
}
