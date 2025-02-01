import { DIRNODE_NAME_CONSTRAINTS } from "./constraints.ts";

function pathToSegments(path: string) {
  return path.split("/").filter((part) => part !== "");
}

export function getPathSegments(path: string) {
  const pathSegments = pathToSegments(path);
  return {
    pathSegments,
    parentPathSegments: pathSegments.slice(0, -1),
    lastPathSegment: pathSegments.at(-1),
    isRootDir: pathSegments.length === 1,
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
