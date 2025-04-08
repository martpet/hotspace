import type { DirNode } from "../inodes/types.ts";

export const ROOT_DIR_ID = "0";

export const ROOT_DIR: DirNode = {
  id: ROOT_DIR_ID,
  type: "dir",
  name: "root",
  parentDirId: "",
  pathSegments: [],
  isRootDir: true,
  ownerId: "",
  acl: {},
  aclStats: {
    usersCount: 0,
    previewSubset: {},
  },
};
