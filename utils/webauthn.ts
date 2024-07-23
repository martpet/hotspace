export const REG_SESSION_COOKIE = "reg_session";

export interface RegSession {
  id: string;
  username: string;
  webauthnUserId: string;
  challenge: string;
}

interface UsernameContraints {
  minLength: number;
  maxLength: number;
  pattern: string;
  patternTitle: string;
}

export function validateUsername(
  username: string,
  contsraints: UsernameContraints,
) {
  return typeof username === "string" &&
    username.length >= contsraints.minLength &&
    username.length <= contsraints.maxLength &&
    Boolean(username.match(contsraints.pattern)?.length);
}

export function createPubKeyOptionsJson(username: string) {
  return {
    rp: { name: "Hotspace" },
    challenge: randomBase64(),
    user: {
      name: username,
      displayName: username,
      id: btoa(crypto.randomUUID()),
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 },
    ],
  };
}

function randomBase64() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
