import { checkIsRole } from "$util";
import { newQueue } from "@henrygd/queue";
import { applyAclDiffs } from "../../util/inodes/acl.ts";
import type { AclDiff } from "../../util/inodes/types.ts";
import { listInodesEntriesByDir } from "../../util/kv/inodes.ts";

export interface QueueMsgChangeDirChildrenAcl {
  type: "change-dir-children-acl";
  dirId: string;
  actingUserId: string;
  diffs: AclDiff[];
}

export function isChangeDirChildrenAcl(
  msg: unknown,
): msg is QueueMsgChangeDirChildrenAcl {
  const { type, dirId, actingUserId, diffs } = msg as Partial<
    QueueMsgChangeDirChildrenAcl
  >;
  return typeof msg === "object" &&
    type === "change-dir-children-acl" &&
    typeof dirId === "string" &&
    typeof actingUserId === "string" &&
    Array.isArray(diffs) && diffs.every(isAclDiff);
}

function isAclDiff(data: unknown): data is AclDiff {
  const { userId, role } = data as Partial<AclDiff>;
  return typeof userId === "string" && (role === null || checkIsRole(role));
}

export async function handleChangeDirChildrenAcl(
  msg: QueueMsgChangeDirChildrenAcl,
) {
  const { dirId, actingUserId, diffs } = msg;
  const entries = await listInodesEntriesByDir(dirId);
  const queue = newQueue(5);

  for (const inodeEntry of entries) {
    queue.add(() =>
      applyAclDiffs({
        inodeEntry,
        actingUserId,
        diffs,
      })
    );
  }

  return queue.done();
}
