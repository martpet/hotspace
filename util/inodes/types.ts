import type { ChatResource } from "$chat";
import type { AclResource, AclRole } from "$util";

export type AclPreview = Record<string, AclRole>;

export interface AclDiffWithUsername {
  username: string;
  role: AclRole | null;
}

export interface AclDiffWithUserId {
  userId: string;
  role: AclRole | null;
}

export type InodeLabel = "Space" | "Folder" | "File";

export type Inode = DirNode | FileNode | VideoNode;

interface InodeBase extends ChatResource, AclResource {
  type: string;
  name: string;
  parentDirId: string;
  aclStats: {
    usersCount: number;
    previewSubset: AclPreview;
  };
}

export interface DirNode extends InodeBase {
  type: "dir";
  pathSegments: string[];
  isRootDir?: boolean;
}

export interface FileNode extends InodeBase {
  type: "file";
  fileType: string;
  fileSize: number;
  s3Key: string;
}

export interface VideoNode extends FileNode {
  fileType: `video/${string}`;
  mediaConvert: {
    jobId: string;
    status: "PENDING" | "COMPLETE" | "ERROR";
    percentComplete: number;
    streamType?: "hls";
    stateChangeTimestamp?: number;
    playlistDataUrl?: string;
    subPlaylistsS3Keys?: string[];
    durationInMs?: number;
  };
}
