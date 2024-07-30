export const kv = await Deno.openKv();

export interface User {
  id: string;
  username: string;
}

export interface Passkey {
  credId: string;
  userId: string;
  webauthnUserId: string;
  pubKey: Uint8Array;
  backupStatus: boolean;
  backupEligible: boolean;
  counter: number;
  createdAt: Date;
  lastUsed: Date;
}
