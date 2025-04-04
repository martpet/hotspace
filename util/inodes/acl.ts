import {
  Acl,
  ACL_ROLE_ALL,
  getAclUsersCount,
  getAclUsersIds,
  getPermissions,
} from "$util";
import { sortBy } from "@std/collections";
import { QueueMsgChangeDirChildrenAcl } from "../../handlers/queue/change_dir_children_acl.ts";
import { keys as usersKeys } from "../../util/kv/users.ts";
import type { AclDiffWithUserId, AclPreview, Inode } from "../inodes/types.ts";
import { enqueue } from "../kv/enqueue.ts";
import { getManyEntries, saveWithRetry } from "../kv/kv.ts";
import type { User } from "../types.ts";
import { ROOT_DIR_ID } from "./consts.ts";

const ACL_PREVIEW_SUBSET_SIZE = 5;

export function createAclPreview(options: {
  users: User[];
  acl: Acl;
  subsetOnly?: boolean;
}) {
  const { users, acl, subsetOnly } = options;
  let usersResult = sortBy(users, (u) => u.username);
  if (subsetOnly) usersResult = usersResult.slice(0, ACL_PREVIEW_SUBSET_SIZE);
  const aclPreview: AclPreview = {};

  for (const user of usersResult) {
    const role = acl[user.id];
    aclPreview[user.username] = role;
  }
  return aclPreview;
}

export async function changeAcl(input: {
  diffs: AclDiffWithUserId[];
  inodeEntry: Deno.KvEntryMaybe<Inode>;
  actingUserId: string;
  recursive?: boolean;
  usersById?: Record<string, User>;
}) {
  const { diffs, inodeEntry, actingUserId, usersById = {}, recursive } = input;
  const inode = inodeEntry.value;
  const isSpace = inode?.parentDirId === ROOT_DIR_ID;

  if (!inode) {
    return;
  }

  if (inode.type === "dir" && recursive) {
    await enqueue<QueueMsgChangeDirChildrenAcl>({
      type: "change-dir-children-acl",
      dirId: inode.id,
      actingUserId,
      diffs,
    }).commit();
  }

  const { canChangeAcl } = getPermissions({
    user: { id: actingUserId },
    resource: inode,
  });

  if (!canChangeAcl) {
    return;
  }

  for (const { role, userId } of diffs) {
    if (userId === actingUserId) {
      continue;
    } else if (userId === inode.ownerId && isSpace) {
      continue;
    } else if (role === null) {
      delete inode.acl[userId];
    } else if (userId === ACL_ROLE_ALL) {
      inode.acl[userId] = "viewer";
    } else {
      inode.acl[userId] = role;
    }
  }

  const extraUsers = {
    kvKeys: <Deno.KvKey[]> [],
    ids: <string[]> [],
  };

  const usersIds = getAclUsersIds(inode.acl);

  for (const userId of usersIds) {
    if (!usersById[userId]) {
      extraUsers.kvKeys.push(usersKeys.byId(userId));
      extraUsers.ids.push(userId);
    }
  }

  if (extraUsers.kvKeys.length) {
    const usersEntries = await getManyEntries<User>(extraUsers.kvKeys, {
      consistency: "eventual",
    });
    usersEntries.forEach(({ value: user }, i) => {
      if (user) {
        usersById[user.id] = user;
      } else {
        const userId = extraUsers.ids[i];
        delete inode.acl[userId];
      }
    });
  }

  inode.aclStats = {
    usersCount: getAclUsersCount(inode.acl),
    previewSubset: createAclPreview({
      users: Object.values(usersById),
      acl: inode.acl,
      subsetOnly: true,
    }),
  };

  return saveWithRetry(inodeEntry);
}
