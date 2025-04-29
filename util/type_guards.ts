import { inodePreviewTypes } from "./inodes/consts.ts";
import type { InodePreviewType } from "./inodes/types.ts";

export function isInodePreviewType(str: unknown): str is InodePreviewType {
  return typeof str === "string" &&
    inodePreviewTypes.includes(str as InodePreviewType);
}
