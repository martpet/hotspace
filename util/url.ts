import { DIRNODE_NAME_CONSTRAINTS } from "./constraints.ts";

export function parsePathname(pathname: string) {
  const segments = pathToSegments(pathname);
  if (!segments.length) {
    throw new Error("Pathname has no segments");
  }
  return {
    segments,
    parentSegments: segments.slice(0, -1),
    lastSegment: segments.at(-1)!,
    isRootSegment: segments.length === 1,
    isDir: pathname.endsWith("/"),
  };
}

export function isValidDirPath(path: unknown): path is string {
  const pathPartPattern = new RegExp(DIRNODE_NAME_CONSTRAINTS.pattern);
  return typeof path === "string" &&
    path.startsWith("/") &&
    pathToSegments(path).every((part) =>
      part.length >= DIRNODE_NAME_CONSTRAINTS.minLength &&
      part.length <= DIRNODE_NAME_CONSTRAINTS.maxLength &&
      pathPartPattern.test(part)
    );
}

function pathToSegments(path: string) {
  return path.split("/").filter((part) => part !== "");
}
