import type {
  ServerContext,
  ServerHandler,
  ServerMiddleware,
} from "../lib/server/mod.ts";

export type Handler = ServerHandler<State>;
export type Context = ServerContext<State>;
export type Middleware = ServerMiddleware<State>;

export interface State {
  user?: User;
  session?: Session;
  flash?: Flash;
}

export interface User {
  id: string;
  username: string;
}

export interface Session {
  id: string;
  userId: string;
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
  lastUsed?: Date;
}

export interface Flash {
  msg: string;
  type?: "info" | "success" | "warning" | "error";
}
