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
import { getInodeById } from "../kv/inodes.ts";
import { getManyEntries } from "../kv/kv.ts";
import type { User } from "../types.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { setAnyInode } from "./kv_wrappers.ts";

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

export function createAclStats(options: { users: User[]; acl: Acl }) {
  const { users, acl } = options;
  return {
    usersCount: getAclUsersCount(acl),
    previewSubset: createAclPreview({ users, acl, subsetOnly: true }),
  };
}

export async function changeAcl(input: {
  diffs: AclDiffWithUserId[];
  inodeEntry: Deno.KvEntryMaybe<Inode>;
  actingUserId: string;
  recursive?: boolean;
  usersById?: Record<string, User>;
}) {
  const { diffs, actingUserId, usersById = {}, recursive } = input;
  let { inodeEntry } = input;
  let inode = inodeEntry.value;
  const isSpace = inode?.parentDirId === ROOT_DIR_ID;

  if (!inode) {
    return;
  }

  const { acl } = inode;

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
      delete acl[userId];
    } else if (userId === ACL_ROLE_ALL) {
      acl[userId] = "viewer";
    } else {
      acl[userId] = role;
    }
  }

  const extraUsers = {
    kvKeys: <Deno.KvKey[]> [],
    ids: <string[]> [],
  };

  const usersIds = getAclUsersIds(acl);

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
        delete acl[userId];
      }
    });
  }

  const aclStats = createAclStats({
    users: Object.values(usersById),
    acl: inode.acl,
  });

  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    if (commitIndex) {
      inodeEntry = await getInodeById(inode.id);
      inode = inodeEntry.value;
      if (!inode) return;
    }
    inode.acl = acl;
    inode.aclStats = aclStats;
    const atomic = setAnyInode(inode);
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}
