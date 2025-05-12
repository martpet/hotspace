import { Acl, ACL_ROLE_ALL, getPermissions, getUserIdsFromAcl } from "$util";
import { sortBy } from "@std/collections";
import { keys as usersKeys } from "../../util/kv/users.ts";
import type { AclDiffWithUserId, AclPreview, Inode } from "../inodes/types.ts";
import { enqueue } from "../kv/enqueue.ts";
import { getInodeById } from "../kv/inodes.ts";
import { getManyEntries } from "../kv/kv.ts";
import { QueueMsgChangeDirChildrenAcl } from "../queue/change_dir_children_acl.ts";
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
    if (role) aclPreview[user.username] = role;
  }
  return aclPreview;
}

export function createAclStats(options: { users: User[]; acl: Acl }) {
  const { users, acl } = options;
  return {
    usersCount: getUserIdsFromAcl(acl).length,
    previewSubset: createAclPreview({ users, acl, subsetOnly: true }),
  };
}

export async function applyAclDiffs(input: {
  diffs: AclDiffWithUserId[];
  inodeEntry: Deno.KvEntryMaybe<Inode>;
  actingUserId: string;
  usersById?: Record<string, User>;
}) {
  const { diffs, actingUserId, usersById = {} } = input;
  let { inodeEntry } = input;
  let inode = inodeEntry.value;

  if (!inode) {
    return;
  }

  const isSpace = inode?.parentDirId === ROOT_DIR_ID;

  if (inode.type === "dir") {
    await enqueue<QueueMsgChangeDirChildrenAcl>({
      type: "change-dir-children-acl",
      dirId: inode.id,
      actingUserId,
      diffs,
    }).commit();
  }

  const perm = getPermissions({
    user: { id: actingUserId },
    resource: inode,
  });

  if (!perm.canChangeAcl) {
    return;
  }

  const { acl } = inode;

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

  const userIdsFromAcl = getUserIdsFromAcl(acl);
  const extraUsersIds: string[] = [];
  const extraUsersKvKeys: Deno.KvKey[] = [];

  for (const id of userIdsFromAcl) {
    if (!usersById[id]) {
      extraUsersIds.push(id);
      extraUsersKvKeys.push(usersKeys.byId(id));
    }
  }

  if (extraUsersKvKeys.length) {
    const usersEntries = await getManyEntries<User>(extraUsersKvKeys, {
      consistency: "eventual",
    });
    usersEntries.forEach(({ value: user }, i) => {
      if (user) {
        usersById[user.id] = user;
      } else {
        const userId = extraUsersIds[i];
        delete acl[userId];
      }
    });
  }

  const aclStats = createAclStats({
    users: Object.values(usersById),
    acl: inode.acl,
  });

  const inodePatch = {
    acl,
    aclStats,
  } satisfies Partial<Inode>;

  let commit = { ok: false };
  let commitIndex = 0;

  while (!commit.ok) {
    if (commitIndex) {
      inodeEntry = await getInodeById(inode.id);
      inode = inodeEntry.value;
      if (!inode) return;
    }
    const atomic = setAnyInode({ ...inode, ...inodePatch });
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}
