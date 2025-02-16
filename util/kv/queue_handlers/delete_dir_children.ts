import { deleteDirChildren } from "../../inodes_helpers.ts";

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

export function handleDeleteDirChildren(msg: QueueMsgDeleteDirChildren) {
  return deleteDirChildren(msg);
}
