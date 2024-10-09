import { concat, equals } from "@std/bytes";
import { SECOND } from "@std/datetime";
import { decodeBase64, encodeBase64Url } from "@std/encoding";
import type {
  CreateCredentialCreationOptions,
  CreateCredentialRequestOptions,
  CredentialCreationOptionsJson,
  CredentialRequestOptionsJson,
  ParsedAuthenticatorData,
  VerifyAssertionOptions,
  VerifyAttestationOptions,
  VerifyAuthSignatureOptions,
} from "./types.ts";

export type * from "./types.ts";

export const SESSION_COOKIE = "session";
export const CREDENTIAL_CREATION_SESSION_COOKIE = "credential_creation_session";
export const CREDENTIAL_REQUEST_SESSION_COOKIE = "credential_request_session";
export const WEBAUTHN_TIMEOUT = SECOND * 60;

export function createCredentialCreationOptions(
  options: CreateCredentialCreationOptions,
): CredentialCreationOptionsJson {
  return {
    rp: {
      name: options.rpName,
      id: options.rpId,
    },
    user: {
      id: options.webauthnUserId,
      name: options.userName,
      displayName: options.userDisplayName,
    },
    challenge: generateChallenge(),
    timeout: options.timeout || WEBAUTHN_TIMEOUT,
    authenticatorSelection: {
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "required",
    },
    excludeCredentials: options.excludeCredentials.map((id) => ({
      id,
      type: "public-key",
    })),
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
    ],
  };
}

export function createCredentialRequestOptions(
  options: CreateCredentialRequestOptions,
): CredentialRequestOptionsJson {
  return {
    rpId: options.rpId,
    challenge: generateChallenge(),
    timeout: options.timeout || WEBAUTHN_TIMEOUT,
  };
}

export async function verifyAttestation(options: VerifyAttestationOptions) {
  const {
    attestation,
    expectedChallenge,
    expectedOrigin,
    expectedRpId,
  } = options;
  const clientDataJson = decodeBase64(attestation.clientDataJson);
  const parsedClientData = JSON.parse(new TextDecoder().decode(clientDataJson));
  const authData = decodeBase64(attestation.authData);
  const parsedAuthData = parseAuthenticatorData(authData);
  const { type, challenge, origin } = parsedClientData;
  const { counter, credId, aaguid, flags, rpIdHash } = parsedAuthData;
  const verified = attestation.type === "public-key" &&
    type === "webauthn.create" &&
    await matchRpIds(rpIdHash, expectedRpId) &&
    challenge === expectedChallenge &&
    origin === expectedOrigin &&
    counter === 0 &&
    attestation.pubKey &&
    credId &&
    aaguid &&
    flags.up &&
    flags.uv;
  if (verified) {
    return parsedAuthData as Required<ParsedAuthenticatorData>;
  }
}

export async function verifyAssertion(options: VerifyAssertionOptions) {
  const {
    assertion,
    pubKey,
    currentCounter,
    expectedChallenge,
    expectedOrigin,
    expectedRpId,
  } = options;
  const signature = decodeBase64(assertion.signature);
  const clientDataJson = decodeBase64(assertion.clientDataJson);
  const parsedClientData = JSON.parse(new TextDecoder().decode(clientDataJson));
  const authData = decodeBase64(assertion.authData);
  const parsedAuthData = parseAuthenticatorData(authData);
  const { type, origin, challenge } = parsedClientData;
  const { counter, flags, rpIdHash } = parsedAuthData;
  const verified = assertion.type === "public-key" &&
    type === "webauthn.get" &&
    challenge === expectedChallenge &&
    origin === expectedOrigin &&
    await matchRpIds(rpIdHash, expectedRpId) &&
    (counter > currentCounter || (counter === 0 && currentCounter === 0)) &&
    flags.up &&
    flags.uv &&
    await verifySignature({ signature, pubKey, clientDataJson, authData });
  if (verified) {
    return parsedAuthData;
  }
}

function parseAuthenticatorData(authData: Uint8Array) {
  let offset = 0;
  const rpIdHash = authData.slice(offset, offset += 32);
  const flagsBytes = authData.slice(offset, offset += 1);
  const flagsNumber = flagsBytes[0];
  const flags = convertFlags(flagsNumber);
  const counterBytes = authData.slice(offset, offset += 4);
  const counter = new DataView(counterBytes.buffer).getUint32(0);
  const toReturn: ParsedAuthenticatorData = { rpIdHash, flags, counter };
  if (flags.at) {
    const aaguid = authData.slice(offset, offset += 16);
    const credIdLenBytes = authData.slice(offset, offset += 2);
    const credIdLen = new DataView(credIdLenBytes.buffer).getUint16(0);
    const credId = authData.slice(offset, offset += credIdLen);
    toReturn.credId = encodeBase64Url(credId);
    toReturn.aaguid = convertAaguid(aaguid);
  }
  return toReturn;
}

function convertFlags(flags: number) {
  return {
    up: !!(flags & (1 << 0)),
    uv: !!(flags & (1 << 2)),
    be: !!(flags & (1 << 3)),
    bs: !!(flags & (1 << 4)),
    at: !!(flags & (1 << 6)),
    ed: !!(flags & (1 << 7)),
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

async function matchRpIds(rpIdHash: Uint8Array, expectedRpId: string) {
  const expectedBytes = new TextEncoder().encode(expectedRpId);
  const expectedHash = await crypto.subtle.digest("SHA-256", expectedBytes);
  return equals(rpIdHash, new Uint8Array(expectedHash));
}

async function verifySignature(options: VerifyAuthSignatureOptions) {
  const { signature, pubKey, authData, clientDataJson } = options;
  const clientDataHash = await crypto.subtle.digest("SHA-256", clientDataJson);
  const signedData = concat([authData, new Uint8Array(clientDataHash)]);
  const key = await crypto.subtle.importKey(
    "spki",
    pubKey,
    { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    parseSignature(signature),
    signedData.buffer,
  );
}

function parseSignature(sig: Uint8Array) {
  const usignature = new Uint8Array(sig);
  const rStart = usignature[4] === 0 ? 5 : 4;
  const rEnd = rStart + 32;
  const sStart = usignature[rEnd + 2] === 0 ? rEnd + 3 : rEnd + 2;
  const r = usignature.slice(rStart, rEnd);
  const s = usignature.slice(sStart);
  return concat([r, s]);
}

function generateChallenge() {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}
