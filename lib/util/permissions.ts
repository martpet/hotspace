type Role =
  | "admin"
  | "viewer"
  | "contributor"
  | "moderator"
  | "moderator_contributor";

type Action =
  | "read"
  | "create"
  | "modify"
  | "moderate"
  | "changeAcl";

export type AccessControlList = Record<string, Role>;
export type ResourcePermissions = Record<`can${Capitalize<Action>}`, boolean>;

interface GetPermissionsInput {
  user: { id: string } | null | undefined;
  resource: { acl: AccessControlList; ownerId: string } | null | undefined;
}

export function getPermissions(
  input: GetPermissionsInput,
): ResourcePermissions {
  const userId = input.user?.id;
  const ownerId = input.resource?.ownerId;
  const acl = input.resource?.acl;
  const role = (userId && acl?.[userId]) || acl?.["*"] || "";
  const isOwner = userId && ownerId && userId === ownerId;
  const isAdmin = role === "admin";

  return {
    canRead: isAdmin ||
      role === "viewer",

    canCreate: isAdmin ||
      role === "contributor" ||
      role === "moderator_contributor",

    canModify: isAdmin ||
      (isOwner &&
          role === "contributor" ||
        role === "moderator_contributor"),

    canModerate: isAdmin ||
      role === "moderator" ||
      role === "moderator_contributor",

    canChangeAcl: isAdmin,
  };
}
