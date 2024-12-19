import type { ChatResource, ChatUserResource } from "$chat";
import type { Context, Middleware } from "$server";
import type { PushSubscription } from "@negrel/webpush";

export type AppContext = Context<
  State & {
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

export interface Inode extends ChatResource {
  type: string;
  name: string;
  ownerId: string;
  description?: string;
}

export interface DirNode extends Inode {
  type: "dir";
}

export interface LeafNode extends Inode {
  dirId: string;
}

export interface FileNode extends LeafNode {
  type: "file";
}
