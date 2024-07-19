export enum RegStatus {
  Idle = "IDLE",
  Pending = "PENDING",
  Success = "SUCCESS",
  Aborted = "ABORTED",
  UsernameTaken = "USERNAME_TAKEN",
  WebAuthnUnsupported = "WEBAUTHN_UNSUPPORTED",
  AuthenticatorError = "AUTHENTICATOR_ERROR",
  GeneralError = "GENERAL_ERROR",
}

export const REG_TIMEOUT = 1000 * 60;

export const REG_SESSION_COOKIE = "reg_session";

export const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 4,
  MAX_LENGTH: 30,
  PATTERN: "^[a-z0-9._-]+$",
  PATTERN_TITLE: "Small letters, numbers, dots, hyphens, and underscores",
};

interface PubKeyOptions {
  user: {
    name: string;
    displayName: string;
    id: string;
  };
  rp: { name: string };
  challenge: string;
  pubKeyCredParams: PublicKeyCredentialParameters[];
}

export interface RegSession {
  id: string;
  username: string;
  webauthnUserId: string;
  challenge: string;
}

export function validateUsername(username: string) {
  const { MIN_LENGTH, MAX_LENGTH, PATTERN } = USERNAME_CONSTRAINTS;
  return typeof username === "string" &&
    username.length >= MIN_LENGTH &&
    username.length <= MAX_LENGTH &&
    Boolean(username.match(PATTERN)?.length);
}

export function createPubKeyOptions(username: string): PubKeyOptions {
  return {
    user: {
      name: username,
      displayName: username,
      id: crypto.randomUUID(),
    },
    rp: { name: "Hotspace" },
    challenge: generateChallengeString(),
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },
      { alg: -257, "type": "public-key" },
    ],
  };
}

function generateChallengeString() {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return btoa(String.fromCharCode(...challenge));
}
