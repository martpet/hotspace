import { DIRNODE_NAME_CONSTRAINTS } from "./constraints.ts";

export function pathnameToParts(pathname: string) {
  return pathname.split("/").filter((part) => part !== "");
}

export function isValidDirPath(pathname: unknown): pathname is string {
  const pathPartPattern = new RegExp(DIRNODE_NAME_CONSTRAINTS.pattern);
  return typeof pathname === "string" &&
    pathname.startsWith("/") &&
    pathnameToParts(pathname).every((part) =>
      part.length >= DIRNODE_NAME_CONSTRAINTS.minLength &&
      part.length <= DIRNODE_NAME_CONSTRAINTS.maxLength &&
      pathPartPattern.test(part)
    );
}

export function getPathParts(pathname: string) {
  const pathParts = pathnameToParts(pathname);
  return {
    pathParts,
    parentPathParts: pathParts.slice(0, -1),
    currentPathPart: pathParts.at(-1),
    isRootDir: pathParts.length === 1,
  };
}
