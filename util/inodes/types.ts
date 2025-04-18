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
    status: "PENDING" | "COMPLETE" | "ERROR";
    jobId?: string;
    percentComplete?: number;
    stateChangeUnixTimestamp?: number;
    playlistDataUrl?: string;
    subPlaylistsS3Keys?: string[];
    streamType?: "hls";
    durationInMs?: number;
    width?: number;
    height?: number;
  };
}

export interface ImageNode extends FileNode {
  fileType: `image/${string}`;
  postProcess: {
    status: "PENDING" | "COMPLETE" | "ERROR";
    stateChangeIsoTimestamp?: string;
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
