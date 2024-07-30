import { decode as decodeCbor } from "cbor-x";
import { REG_TIMEOUT } from "../static/webauthn.js";

export const REG_SESSION_COOKIE = "reg_session";
export const SESSION_COOKIE = "session";

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

interface VerifyRegResponseOpts {
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRpId: string;
  credential: {
    type: string;
    attestationObject: string;
    clientDataJson: string;
  };
}

export function validateUsername(
  username: string,
  contsraints: UsernameContraints,
) {
  return typeof username === "string" &&
    username.length >= contsraints.minLength &&
    username.length <= contsraints.maxLength &&
    new RegExp(contsraints.pattern).test(username);
}

export function createPubKeyOptionsJson(username: string, url: URL) {
  return {
    rp: {
      name: "Hotspace",
      id: url.hostname,
    },
    challenge: generateChallenge(),
    timeout: REG_TIMEOUT,
    user: {
      id: crypto.randomUUID(),
      name: username,
      displayName: username,
    },
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 },
    ],
  };
}

export async function verifyRegResponse(options: VerifyRegResponseOpts) {
  const {
    credential,
    expectedChallenge,
    expectedOrigin,
    expectedRpId,
  } = options;
  const { attestationObject, clientDataJson } = credential;
  const clientData = JSON.parse(base64ToUtf8(clientDataJson));
  const authData = decodeAuthData(attestationObject);

  const verified = credential.type === "public-key" &&
    clientData.type === "webauthn.create" &&
    clientData.challenge === expectedChallenge &&
    clientData.origin === expectedOrigin &&
    await matchRpId(authData.rpIdHash, expectedRpId) &&
    authData.flags.up &&
    authData.flags.uv &&
    !!authData.credentialId &&
    !!authData.publicKey &&
    !!authData.aaguid;

  return {
    verified,
    authData,
  };
}

function decodeAuthData(attestationObject: string) {
  const decodedObject = decodeCbor(base64ToBytes(attestationObject));
  const authData = decodedObject.authData as Uint8Array;
  let offset = 0;
  const rpIdHash = authData.slice(offset, offset += 32);
  const flagsBytes = authData.slice(offset, offset += 1);
  const flags = flagsBytes[0];
  const counterBytes = authData.slice(offset, offset += 4);
  const counter = new DataView(counterBytes.buffer).getUint32(0);
  const aaguidBytes = authData.slice(offset, offset += 16);
  const credIdLenBytes = authData.slice(offset, offset += 2);
  const credIdLen = new DataView(credIdLenBytes.buffer).getUint16(0);
  const credIdBytes = authData.slice(offset, offset += credIdLen);
  const publicKeyBytes = authData.slice(offset);

  return {
    rpIdHash,
    flags: covertFlags(flags),
    counter,
    credentialId: bufferToBase64Url(credIdBytes),
    publicKey: decodeCbor(publicKeyBytes),
    aaguid: convertAaguid(aaguidBytes),
  };
}

function convertAaguid(aaguidBytes: Uint8Array) {
  const hexArray = Array.from(aaguidBytes).map((byte) =>
    byte.toString(16).padStart(2, "0")
  );
  const hexString = hexArray.join("");
  return [
    hexString.slice(0, 8),
    hexString.slice(8, 12),
    hexString.slice(12, 16),
    hexString.slice(16, 20),
    hexString.slice(20, 32),
  ].join("-");
}

function covertFlags(flags: number) {
  return {
    up: !!(flags & (1 << 0)),
    uv: !!(flags & (1 << 2)),
    be: !!(flags & (1 << 3)),
    bs: !!(flags & (1 << 4)),
    at: !!(flags & (1 << 6)),
    ed: !!(flags & (1 << 7)),
  };
}

async function matchRpId(rpIdHash: Uint8Array, expectedRpId: string) {
  const buffer = new TextEncoder().encode(expectedRpId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const expectedHash = new Uint8Array(hashBuffer);
  return rpIdHash.length === expectedHash.length &&
    rpIdHash.every((b, i) => b === expectedHash[i]);
}

function generateChallenge() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToBase64Url(bytes);
}

function bufferToBase64Url(buffer: ArrayBuffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64ToBytes(base64: string) {
  return Uint8Array.from(atob(base64), (byte) => byte.charCodeAt(0));
}

function base64ToUtf8(base64: string) {
  return new TextDecoder("utf-8").decode(base64ToBytes(base64));
}
