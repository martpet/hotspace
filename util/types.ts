import type { ChatUserResource } from "$chat";
import type { Context, Handler, Middleware } from "$server";
import type { PushSubscription } from "@negrel/webpush";

export interface State {
  session?: Session;
  user?: User;
  from?: string;
  canUseServiceWorker?: boolean;
}

export type AppContext = Context<State>;
export type AppHandler = Handler<State>;
export type AppMiddleware = Middleware<State>;

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
  aaguidLabel?: string;
}

export interface Settings {
  initialUploadQuota: number;
  displayInitialUploadQuota: boolean;
}

export type Product = "upload_traffic_1_gb";

export interface PaymentIntent {
  userId: string;
  stripeIntentId: string;
  product: Product;
  quantity: number;
  amount: number;
}

export interface Payment extends PaymentIntent {
  id: string;
  stripeEventId: string;
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
