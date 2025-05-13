import { Acl, ACL_ID_ALL, getPermissions, getUserIdsFromAcl } from "$util";
import { associateBy, sortBy } from "@std/collections";
import type { AclDiff, AclPreview, Inode } from "../inodes/types.ts";
import { enqueue } from "../kv/enqueue.ts";
import { getInodeById } from "../kv/inodes.ts";
import { getMany } from "../kv/kv.ts";
import { keys as getUserKvKey } from "../kv/users.ts";
import { QueueMsgChangeDirChildrenAcl } from "../queue/change_dir_children_acl.ts";
import type { User } from "../types.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { setAnyInode } from "./kv_wrappers.ts";

export async function applyAclDiffs(input: {
  diffs: AclDiff[];
  inodeEntry: Deno.KvEntryMaybe<Inode>;
  actingUserId: string;
  users?: User[];
  recursive?: boolean;
}) {
  const { diffs, actingUserId, users, recursive = true } = input;

  let { inodeEntry } = input;
  let inode = inodeEntry.value;
  if (!inode) return;

  const perm = getPermissions({
    user: { id: actingUserId },
    resource: inode,
  });

  if (!perm.canChangeAcl) {
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

  const acl = { ...inode.acl };
  const isSpace = inode?.parentDirId === ROOT_DIR_ID;

  for (const { userId, role } of diffs) {
    if (
      userId === actingUserId ||
      isSpace && userId === inode.ownerId
    ) {
      continue;
    } else if (role === null) {
      delete acl[userId];
    } else if (userId === ACL_ID_ALL) {
      acl[userId] = "viewer";
    } else {
      acl[userId] = role;
    }
  }

  const aclStats = await createAclStats({
    acl,
    users,
    previewFromPatch: {
      diffs,
      aclPreview: inode.aclStats.previewSubset,
    },
  });

  const inodePatch = { acl, aclStats } satisfies Partial<Inode>;

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

export async function createAclStats(input: {
  acl: Acl;
  users?: User[];
  previewFromPatch?: Parameters<typeof createAclPreview>[0]["fromPatch"];
}) {
  const { acl, users, previewFromPatch } = input;
  const usersCount = getUserIdsFromAcl(acl).length;
  const previewSubset = await createAclPreview({
    acl,
    users,
    subsetOnly: true,
    fromPatch: previewFromPatch,
  });
  return {
    usersCount,
    previewSubset,
  };
}

export async function createAclPreview(input: {
  acl: Acl;
  users?: User[];
  subsetOnly?: boolean;
  fromPatch?: {
    diffs: AclDiff[];
    aclPreview: AclPreview;
  };
}) {
  const { acl, users = [], subsetOnly, fromPatch } = input;
  const usersById = associateBy(users, (u) => u.id);
  const ACL_PREVIEW_SUBSET_SIZE = 5;

  if (fromPatch) {
    const { diffs, aclPreview } = fromPatch;
    const isRemoveOnly = diffs.every((diff) => [
      diff.role === null &&
      usersById[diff.userId],
    ]);
    if (isRemoveOnly) {
      for (const diff of diffs) {
        const user = usersById[diff.userId];
        if (user) delete aclPreview[user.username];
      }
      return aclPreview;
    }
  }

  const userIdsFromAcl = getUserIdsFromAcl(acl);
  const notProvidedUsersKvKeys = [];

  for (const id of userIdsFromAcl) {
    if (!usersById[id]) {
      notProvidedUsersKvKeys.push(getUserKvKey.byId(id));
    }
  }

  const notProvidedUsers = await getMany<User>(notProvidedUsersKvKeys);

  for (const user of notProvidedUsers) {
    usersById[user.id] = user;
  }

  let usersFromAcl = userIdsFromAcl
    .map((id) => usersById[id])
    .filter(Boolean);

  usersFromAcl = sortBy(usersFromAcl, (u) => u.username);

  if (subsetOnly) {
    usersFromAcl.slice(0, ACL_PREVIEW_SUBSET_SIZE);
  }

  return Object.fromEntries(usersFromAcl.map((u) => [u.username, acl[u.id]]));
}
