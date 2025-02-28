import type { ChatResource, ChatUserResource } from "$chat";
import type { Context, Middleware } from "$server";
import type { PushSubscription } from "@negrel/webpush";

export type AppContext = Context<
  State & {
    from?: string;
    canUseServiceWorker?: boolean;
  }
>;

export type AppMiddleware = Middleware<AppContext>;

export interface State {
  session?: Session;
  user?: User;
}

export interface User extends ChatUserResource {
  id: string;
  username: string;
  webauthnUserId: string;
}

export interface Session {
  id: string;
  userId: string;
  credId: string;
}

export interface CredentialCreationSession {
  id: string;
  webauthnUserId: string;
  username: string;
  challenge: string;
}

export interface Passkey {
  credId: string;
  userId: string;
  pubKey: Uint8Array;
  counter: number;
  aaguid: string;
  createdAt: Date;
  lastUsedAt?: Date;
  name?: string;
}

export interface PushSub extends PushSubscription {
  expirationTime?: number;
}

export interface PushMessage extends Record<string, unknown> {
  type: string;
}

export interface PushSubscriber {
  id: string;
  pushSub: PushSub | null;
  pushSubUpdatedAt: Date;
}

export type Inode = DirNode | FileNode | VideoNode;

interface InodeBase extends ChatResource {
  type: string;
  name: string;
  parentDirId: string;
  ownerId: string;
  description?: string;
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
  streamType: "hsl";
  mediaconvert: {
    status: "pending" | "complete" | "error";
    jobId?: string;
  };
}
