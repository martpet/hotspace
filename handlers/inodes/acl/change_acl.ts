import {
  ACL_ROLE_ALL,
  checkIsRole,
  getAclUsersIds,
  getPermissions,
} from "$util";
import { associateBy } from "@std/collections";
import { STATUS_CODE } from "@std/http";
import { changeAcl } from "../../../util/inodes/acl.ts";
import type {
  AclDiffWithUserId,
  AclDiffWithUsername,
} from "../../../util/inodes/types.ts";
import { getInodeById } from "../../../util/kv/inodes.ts";
import { getManyEntries } from "../../../util/kv/kv.ts";
import { keys as usersKeys } from "../../../util/kv/users.ts";
import type { AppContext, User } from "../../../util/types.ts";

interface ReqData {
  inodeId: string;
  diffs: AclDiffWithUsername[];
}

export default async function changeAclHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const reqData = await ctx.req.json();

  if (!isValidReqData(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { inodeId, diffs } = reqData;
  const inodeEntry = await getInodeById(inodeId);
  const inode = inodeEntry.value;
  const { canChangeAcl } = getPermissions({ user, resource: inode });

  if (!inode || !canChangeAcl) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const usersIds = getAclUsersIds(inode.acl);
  const usersKvKeys = [];
  const exraUsersKvKeys = [];
  const extraUsersDiffs: AclDiffWithUsername[] = [];
  const usersByUsername: Record<string, User> = {};
  const finalDiffs: AclDiffWithUserId[] = [];

  const respData = {
    notFoundUsernames: <string[]> [],
  };

  for (const userId of usersIds) {
    usersKvKeys.push(usersKeys.byId(userId));
  }

  const userEntriesFromAcl = await getManyEntries<User>(usersKvKeys, {
    consistency: "eventual",
  });

  userEntriesFromAcl.forEach(({ value: user }, i) => {
    if (user) {
      usersByUsername[user.username] = user;
    } else {
      const userId = usersIds[i];
      finalDiffs.push({ userId, role: null });
    }
  });

  for (const diff of diffs) {
    const { username, role } = diff;
    if (username === "") {
      continue;
    }
    if (username === ACL_ROLE_ALL) {
      finalDiffs.push({ userId: username, role });
      continue;
    }
    const existingUser = usersByUsername[username];
    if (existingUser) {
      finalDiffs.push({ userId: existingUser.id, role });
    } else {
      exraUsersKvKeys.push(usersKeys.byUsername(username));
      extraUsersDiffs.push(diff);
    }
  }

  if (exraUsersKvKeys.length) {
    const userEntries = await getManyEntries<User>(exraUsersKvKeys, {
      consistency: "eventual",
    });
    userEntries.forEach(({ value: user }, i) => {
      const { username, role } = extraUsersDiffs[i];
      if (user) {
        finalDiffs.push({ userId: user.id, role });
        usersByUsername[user.id] = user;
      } else {
        respData.notFoundUsernames.push(username);
      }
    });
  }

  if (finalDiffs.length) {
    const usersById = associateBy(Object.values(usersByUsername), (u) => u.id);
    await changeAcl({
      diffs: finalDiffs,
      inodeEntry,
      actingUserId: user.id,
      recursive: true,
      usersById,
    });
  }

  return ctx.json(respData);
}

function isValidReqData(data: unknown): data is ReqData {
  const { inodeId, diffs } = data as Partial<ReqData>;
  return typeof data === "object" &&
    typeof inodeId === "string" &&
    Array.isArray(diffs) && diffs.every(isAclDiffWithUsername);
}

function isAclDiffWithUsername(data: unknown): data is AclDiffWithUsername {
  const { username, role } = data as Partial<AclDiffWithUsername>;
  return typeof username === "string" && (role === null || checkIsRole(role));
}
