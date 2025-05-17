import type { ChatUserResource } from "$chat";
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

export interface UploadCredit {
  startBytes: number;
  limitBytes: number;
}

export interface User extends ChatUserResource {
  id: string;
  username: string;
  webauthnUserId: string;
  uploadCredit: UploadCredit;
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
  aaguidLabel?: string;
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
  userId?: string;
  username?: string;
}
