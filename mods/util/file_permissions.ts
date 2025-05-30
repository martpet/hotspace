export const ACL_ID_ALL = "*";

type UserId = string;

const roles = [
  "admin",
  "viewer",
  "contributor",
  "moderator",
  "contributor_moderator",
] as const;

export type AclRole = typeof roles[number];

type Action =
  | "read"
  | "create"
  | "modify"
  | "moderate"
  | "changeAcl"
  | "viewAcl";

export type Acl = Record<UserId, AclRole>;
export type ResourcePermissions = Record<`can${Capitalize<Action>}`, boolean>;

export interface AclResource {
  id: string;
  ownerId: string;
  acl: Acl;
}

interface PermissionsOptions {
  user: { id: string } | null | undefined;
  resource: AclResource | null | undefined;
}

export function getPermissions(opt: PermissionsOptions): ResourcePermissions {
  const userId = opt.user?.id;
  const ownerId = opt.resource?.ownerId;
  const acl = opt.resource?.acl;
  const role = (userId && acl?.[userId]) || acl?.[ACL_ID_ALL];
  const isOwner = !!(userId && ownerId && userId === ownerId);
  const isAdmin = role === "admin";
  const isContributor = checkContributor(role);
  const isModerator = checkModerator(role);

  return {
    canRead: checkCanRead(role),
    canCreate: isAdmin || isContributor,
    canModify: isAdmin || (isContributor && isOwner),
    canModerate: isAdmin || isModerator,
    canChangeAcl: isAdmin,
    canViewAcl: isAdmin,
  };
}

function checkCanRead(role?: AclRole) {
  return role === "admin" || role === "viewer" ||
    checkContributor(role) || checkModerator(role);
}

function checkContributor(role?: AclRole) {
  return role === "contributor" || role === "contributor_moderator";
}

function checkModerator(role?: AclRole) {
  return role === "moderator" || role === "contributor_moderator";
}

export function checkHasPublicAccess(resource: AclResource) {
  return checkCanRead(resource.acl[ACL_ID_ALL]);
}

export function checkIsRole(role: unknown): role is AclRole {
  return roles.includes(role as AclRole);
}

export function getUserIdsFromAcl(acl: Acl) {
  const ids = [];
  for (const userId of Object.keys(acl)) {
    if (userId !== ACL_ID_ALL) ids.push(userId);
  }
  return ids;
}
