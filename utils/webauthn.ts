import { decode as cborDecode } from "cbor-x";
import { REG_TIMEOUT } from "../static/webauthn.js";

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

export async function verifyRegResponse(opt: VerifyRegResponseOpts) {
  const { credential } = opt;
  const { attestationObject, clientDataJson } = credential;
  const clientData = JSON.parse(base64ToUtf8(clientDataJson));
  const authData = decodeAuthData(attestationObject);

  const verified = credential.type === "public-key" &&
    clientData.type === "webauthn.create" &&
    clientData.challenge === opt.expectedChallenge &&
    clientData.origin === opt.expectedOrigin &&
    await matchRpId(authData.rpIdHash, opt.expectedRpId) &&
    authData.flags.up &&
    authData.flags.uv &&
    !!authData.credentialId &&
    // !!authData.publicKey &&
    !!authData.aaguid;

  return {
    verified,
    authData,
  };
}

function generateChallenge() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToBase64Url(bytes);
}

function decodeAuthData(attestationObject: string) {
  const decodedObject = cborDecode(base64ToBytes(attestationObject));
  const data = decodedObject.authData as Uint8Array;
  const dataView = new DataView(data.buffer, data.byteOffset, data.length);
  const rpIdHash = data.slice(0, 32);
  const flagsBytes = data.slice(32, 33);
  const flagsInt = flagsBytes[0];
  const aaguidBytes = data.slice(37, 53);
  const credentialIdLen = dataView.getUint16(53);
  const credentialIdBytes = data.slice(53, 53 + credentialIdLen);
  // const publicKeyBytes = data.slice(53 + credentialIdLen);

  return {
    rpIdHash,
    credentialId: bufferToBase64Url(credentialIdBytes),
    // publicKey: cborDecode(publicKeyBytes),
    aaguid: convertAaguid(aaguidBytes),
    counter: dataView.getUint32(33),
    flags: {
      up: !!(flagsInt & (1 << 0)),
      uv: !!(flagsInt & (1 << 2)),
      be: !!(flagsInt & (1 << 3)),
      bs: !!(flagsInt & (1 << 4)),
      at: !!(flagsInt & (1 << 6)),
      ed: !!(flagsInt & (1 << 7)),
    },
  };
}

function convertAaguid(aaguid: Uint8Array) {
  const hex = Array.from(aaguid)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

async function matchRpId(rpIdHash: Uint8Array, expectedRpId: string) {
  const buffer = new TextEncoder().encode(expectedRpId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const expectedHash = new Uint8Array(hashBuffer);
  return rpIdHash.length === expectedHash.length &&
    rpIdHash.every((b, i) => b === expectedHash[i]);
}

function bufferToBase64Url(buffer: ArrayBuffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64ToBytes(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function base64ToUtf8(base64: string) {
  return new TextDecoder("utf-8").decode(base64ToBytes(base64));
}
