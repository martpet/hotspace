import { Acl, ACL_ID_ALL, getPermissions, getUserIdsFromAcl } from "$util";
import { associateBy, sortBy } from "@std/collections";
import type { AclDiff, AclPreview, Inode } from "../inodes/types.ts";
import { deleteInAclOfNotOwnInode, setInAclNotOwnInode } from "../kv/acl.ts";
import { enqueue } from "../kv/enqueue.ts";
import { getInodeById } from "../kv/inodes.ts";
import { getMany, kv } from "../kv/kv.ts";
import { keys as getUserKvKey } from "../kv/users.ts";
import { QueueMsgChangeDirChildrenAcl } from "../queue/change_dir_children_acl.ts";
import type { User } from "../types.ts";
import { ROOT_DIR_ID } from "./consts.ts";
import { setAnyInode } from "./kv_wrappers.ts";

type PartialUser = Pick<User, "id" | "username">;

export async function applyAclDiffs(opt: {
  diffs: AclDiff[];
  inodeEntry: Deno.KvEntryMaybe<Inode>;
  actingUserId: string;
  users?: PartialUser[];
  recursive?: boolean;
}) {
  const { diffs, actingUserId, users, recursive = true } = opt;

  let { inodeEntry } = opt;
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
  const atomic = kv.atomic();

  for (const { userId, role } of diffs) {
    const { ownerId } = inode;

    if (userId === actingUserId || isSpace && userId === ownerId) {
      continue;
    }

    if (role === null) {
      delete acl[userId];
    } else if (userId === ACL_ID_ALL) {
      acl[userId] = "viewer";
    } else {
      acl[userId] = role;
    }

    if (userId !== ownerId && userId !== ACL_ID_ALL) {
      if (role === null) {
        deleteInAclOfNotOwnInode({
          userId,
          inodeId: inode.id,
          atomic,
        });
      } else {
        setInAclNotOwnInode({
          userId,
          inodeId: inode.id,
          atomic,
        });
      }
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
    setAnyInode({ ...inode, ...inodePatch }, atomic);
    atomic.check(inodeEntry);
    commit = await atomic.commit();
    commitIndex++;
  }
}

export async function createAclStats(opt: {
  acl: Acl;
  users?: PartialUser[];
  previewFromPatch?: Parameters<typeof createAclPreview>[0]["fromPatch"];
}) {
  const { acl, users, previewFromPatch } = opt;
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

export async function createAclPreview(opt: {
  acl: Acl;
  users?: PartialUser[];
  subsetOnly?: boolean;
  fromPatch?: {
    diffs: AclDiff[];
    aclPreview: AclPreview;
  };
}) {
  const { acl, users = [], subsetOnly, fromPatch } = opt;
  const usersById = associateBy(users, (u) => u.id);
  const ACL_PREVIEW_SUBSET_SIZE = 5;

  if (fromPatch) {
    const { diffs, aclPreview } = fromPatch;
    const isRemoveOnly = diffs.every((diff) =>
      diff.role === null &&
      usersById[diff.userId]
    );
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
