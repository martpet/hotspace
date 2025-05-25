import { ACL_ID_ALL, checkIsRole, getPermissions } from "$util";
import { associateBy } from "@std/collections";
import { STATUS_CODE } from "@std/http";
import { applyAclDiffs } from "../../../util/inodes/acl.ts";
import type { AclDiffWithUsername } from "../../../util/inodes/types.ts";
import { getInodeById } from "../../../util/kv/inodes.ts";
import { getManyEntries } from "../../../util/kv/kv.ts";
import { keys as getUserKey } from "../../../util/kv/users.ts";
import type { AppContext, User } from "../../../util/types.ts";

interface ReqData {
  inodeId: string;
  diffsWithUsername: AclDiffWithUsername[];
}

export default async function applyAclDiffsHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { inodeId, diffsWithUsername } = reqData;
  const inodeEntry = await getInodeById(inodeId);
  const inode = inodeEntry.value;
  const perm = getPermissions({ user, resource: inode });

  if (!inode || !perm.canChangeAcl) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const usernamesFromDiff: string[] = [];
  const usersKvKeysFromDiff = [];

  for (const { username } of diffsWithUsername) {
    if (username !== ACL_ID_ALL) {
      usernamesFromDiff.push(username);
      usersKvKeysFromDiff.push(getUserKey.byUsername(username));
    }
  }

  const userEntriesFromDiff = await getManyEntries<User>(usersKvKeysFromDiff);
  const usersFromDiff: User[] = [];

  for (const { value: user } of userEntriesFromDiff) {
    if (user) usersFromDiff.push(user);
  }

  const usersFromDiffByUsername = associateBy(usersFromDiff, (u) => u.username);
  const diffs = [];
  const notFoundIntroducedUsernames: string[] = [];

  for (const { username, role } of diffsWithUsername) {
    const user = usersFromDiffByUsername[username];
    if (username === ACL_ID_ALL) {
      diffs.push({ userId: ACL_ID_ALL, role });
    } else if (user) {
      diffs.push({ userId: user.id, role });
    } else if (role !== null) {
      notFoundIntroducedUsernames.push(username);
    }
  }

  if (!notFoundIntroducedUsernames.length) {
    await applyAclDiffs({
      diffs,
      inodeEntry,
      actingUserId: user.id,
      users: usersFromDiff,
    });
  }

  return ctx.respondJson({
    notFoundIntroducedUsernames,
  });
}

function isValidReqData(data: unknown): data is ReqData {
  const { inodeId, diffsWithUsername } = data as Partial<ReqData>;
  return typeof data === "object" &&
    typeof inodeId === "string" &&
    Array.isArray(diffsWithUsername) &&
    diffsWithUsername.every(isAclDiffWithUsername);
}

function isAclDiffWithUsername(data: unknown): data is AclDiffWithUsername {
  const { username, role } = data as Partial<AclDiffWithUsername>;
  return typeof username === "string" && (role === null || checkIsRole(role));
}
