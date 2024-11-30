import type { ChatResource, ChatUser } from "$chat";
import type { Context, Middleware } from "$server";
import type { PushSubscription } from "@negrel/webpush";

export type AppContext = Context<State>;
export type AppMiddleware = Middleware<AppContext>;

export interface State {
  session?: Session;
  user?: User;
  userEntry?: Deno.KvEntryMaybe<User>;
}

export interface User extends ChatUser {
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

export interface Space extends ChatResource {
  id: string;
  name: string;
  ownerUsername: string;
  description?: string;
}

export interface SpaceItem extends ChatResource {
  id: string;
  name: string;
}

export interface PushSub extends PushSubscription {
  expirationTime?: number;
}

export interface PushMessage extends Record<string, unknown> {
  type: string;
}

export interface Subscriber {
  id: string;
  pushSub: PushSub | null;
  pushSubUpdatedAt: Date;
}
