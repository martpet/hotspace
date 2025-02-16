import { pathToSegments } from "$util";
import { DIRNODE_NAME_CONSTRAINTS } from "./constraints.ts";

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
