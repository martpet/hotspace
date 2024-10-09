export interface ParsedAuthenticatorData {
  rpIdHash: Uint8Array;
  flags: Record<"up" | "uv" | "be" | "bs" | "at" | "ed", boolean>;
  counter: number;
  credId?: string;
  aaguid?: string;
}

export interface CreateCredentialCreationOptions {
  rpId: string;
  rpName: string;
  userName: string;
  userDisplayName: string;
  webauthnUserId: string;
  excludeCredentials: string[];
  timeout?: number;
}

export type CredentialCreationOptionsJson =
  & Omit<
    PublicKeyCredentialCreationOptions,
    "user" | "challenge" | "excludeCredentials"
  >
  & {
    user: Omit<PublicKeyCredentialCreationOptions["user"], "id"> & {
      id: string;
    };
    challenge: string;
    excludeCredentials: { id: string; type: "public-key" }[];
  };

export interface CreateCredentialRequestOptions {
  rpId: string;
  timeout?: number;
}

export type CredentialRequestOptionsJson =
  & Omit<PublicKeyCredentialRequestOptions, "challenge">
  & {
    challenge: string;
  };

export interface VerifyAttestationOptions {
  attestation: {
    type: string;
    authData: string;
    clientDataJson: string;
    pubKey: string;
  };
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRpId: string;
}

export interface VerifyAssertionOptions {
  assertion: {
    type: string;
    credId: string;
    signature: string;
    authData: string;
    clientDataJson: string;
  };
  pubKey: Uint8Array;
  currentCounter: number;
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRpId: string;
}

export interface VerifyAuthSignatureOptions {
  clientDataJson: Uint8Array;
  signature: Uint8Array;
  authData: Uint8Array;
  pubKey: Uint8Array;
}
