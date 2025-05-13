import type { ChatResource } from "$chat";
import type { AclResource, AclRole } from "$util";
import type { PostProcessor } from "./post_process/types.ts";

export type AclPreview = Record<string, AclRole>;

export interface AclDiffWithUsername {
  username: string;
  role: AclRole | null;
}

export interface AclDiff {
  userId: string;
  role: AclRole | null;
}

export type Inode = DirNode | FileNode;
export type InodeLabel = "Space" | "Folder" | "File";
export type InodeDisplay = "image" | "iframe" | "video" | "audio" | "font";
export type PostProcessStatus = "PENDING" | "COMPLETE" | "ERROR";

export interface InodeBase extends ChatResource, AclResource {
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
  mimeType: string;
  fileSize: number;
  s3Key: string;
  postProcess?: FileNodePostProcessData;
}

interface FileNodePostProcessData {
  proc: PostProcessor;
  status: PostProcessStatus;
  stateChangeDate?: Date;
  previewFileName?: string;
  previewMimeType?: string;
  thumbFileName?: string;
}

export type PostProcessedFileNode =
  & Omit<FileNode, "postProcess">
  & Required<Pick<FileNode, "postProcess">>;

export interface PostProcessedToVideo extends FileNode {
  postProcess: FileNodePostProcessData & {
    jobId?: string;
    percentComplete?: number;
    playlistDataUrl?: string;
    subPlaylistsS3Keys?: string[];
    streamType?: "hls";
    durationInMs?: number;
    width?: number;
    height?: number;
  };
}

export interface PostProcessedToImage extends FileNode {
  postProcess: FileNodePostProcessData & {
    width?: number;
    height?: number;
    exif?: Exif;
  };
}

export interface Exif {
  Make?: string;
  Model?: string;
  DateTimeOriginal?: Date;
  OffsetTimeOriginal?: string;
  GPSLatitudeRef?: string;
  GPSLatitude?: [number, number, number];
  GPSLongitudeRef?: string;
  GPSLongitude?: [number, number, number];
  GPSAltitudeRef?: number;
  GPSAltitude?: number;
  GPSSpeedRef?: string;
  GPSSpeed?: number;
  GPSImgDirectionRef?: string;
  GPSImgDirection?: number;
  GPSDestBearingRef?: string;
  GPSDestBearing?: number;
  GPSHPositioningError?: number;
}
