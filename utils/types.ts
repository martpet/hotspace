import type { Context, Middleware } from "$server";

export type AppContext = Context<State>;
export type AppMiddleware = Middleware<State>;

interface State {
  user?: User;
}

export interface User {
  id: string;
  username: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface RegSession {
  id: string;
  username: string;
  webauthnUserId: string;
  challenge: string;
}

export interface Passkey {
  credId: string;
  userId: string;
  webauthnUserId: string;
  pubKey: Uint8Array;
  backupEligible: boolean;
  backedUp: boolean;
  counter: number;
  createdAt: Date;
  lastUsed: Date;
}
