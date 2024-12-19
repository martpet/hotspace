import { INODE_NAME_CONSTRAINTS } from "./constraints.ts";

export function pathnameToParts(pathname: string) {
  return pathname.split("/").filter((part) => part !== "");
}

export function isValidPathname(pathname: unknown): pathname is string {
  const pathPartPattern = new RegExp(INODE_NAME_CONSTRAINTS.pattern);
  return typeof pathname === "string" &&
    pathname.startsWith("/") &&
    pathnameToParts(pathname).every((part) =>
      part.length >= INODE_NAME_CONSTRAINTS.minLength &&
      part.length <= INODE_NAME_CONSTRAINTS.maxLength &&
      pathPartPattern.test(part)
    );
}

export function getDirPathInfo(pathname: string) {
  const pathParts = pathnameToParts(pathname);
  return {
    dirPathParts: pathnameToParts(pathname),
    dirName: pathParts.at(-1),
    isRootDir: pathParts.length === 1,
    parentDirPathParts: pathParts.slice(0, -1),
  };
}
