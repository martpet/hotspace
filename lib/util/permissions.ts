export type Acl = Record<UserId, Group | Action[]>;

type UserId = string;
type Group = "admin";

type Action =
  | "read"
  | "create"
  | "modify"
  | "modify_own"
  | "moderate"
  | "change_acl";

export interface Permission {
  canRead: boolean;
  canCreate: boolean;
  canModify: boolean;
  canModerate: boolean;
  canChangeAcl: boolean;
}

export function getPermissions(input: {
  user: { id: string } | null | undefined;
  resource: { acl: Acl; ownerId: string } | null | undefined;
}): Permission {
  const { user, resource } = input;

  const per = {
    canRead: false,
    canCreate: false,
    canModify: false,
    canModerate: false,
    canChangeAcl: false,
  };

  if (resource) {
    const userId = user?.id;
    const { acl, ownerId } = resource;
    const match = userId && acl?.[userId] || acl?.["*"];
    if (match) {
      const isAdmin = match === "admin";
      per.canRead = isAdmin || match.includes("read");
      per.canCreate = isAdmin || match.includes("create");
      per.canModify = isAdmin || match.includes("modify") ||
        (match.includes("modify_own") && userId === ownerId);
      per.canModerate = isAdmin || match.includes("moderate");
      per.canChangeAcl = isAdmin || match.includes("change_acl");
    }
  }

  return per;
}
