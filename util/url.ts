import { INODE_NAME_CONSTRAINTS } from "./constraints.ts";
import type { DirNode, Inode } from "./types.ts";

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

export function getPathParts(pathname: string) {
  const pathParts = pathnameToParts(pathname);
  return {
    pathParts,
    parentPathParts: pathParts.slice(0, -1),
    currentPathPart: pathParts.at(-1),
    isRootDir: pathParts.length === 1,
  };
}

export function getInodeHref(inode: Inode, pathname: string) {
  let href = inode.name;
  if ((inode as DirNode).type === "dir") href = href + "/";
  if (!pathname.endsWith("/")) href = pathname + "/" + href;
  return href;
}
