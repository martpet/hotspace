import type { Context, Middleware } from "$server";

export type AppContext = Context<State>;
export type AppMiddleware = Middleware<AppContext>;

export interface State {
  session?: Session | null;
  user?: User | null;
}

export interface User {
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

interface ChatOptions {
  chatEnabled?: boolean;
}

export interface Space extends ChatOptions {
  id: string;
  name: string;
  ownerUsername: string;
  description?: string;
}

export interface SpaceItem extends ChatOptions {
  id: string;
  name: string;
}

export interface FormFieldConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  title?: string;
}
