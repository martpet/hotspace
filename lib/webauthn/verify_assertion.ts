import { decodeBase64 } from "@std/encoding";
import { matchRpIds } from "./match_rp_ids.ts";
import { parseAuthenticatorData } from "./parse_authenticator_data.ts";
import { verifySignature } from "./verify_signature.ts";

interface VerifyAssertionOptions {
  pubKey: Uint8Array;
  currentCounter: number;
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRpId: string;
  assertion: {
    type: string;
    credId: string;
    signature: string;
    authData: string;
    clientDataJson: string;
  };
}

export async function verifyAssertion(opt: VerifyAssertionOptions) {
  const {
    assertion,
    pubKey,
    currentCounter,
    expectedChallenge,
    expectedOrigin,
    expectedRpId,
  } = opt;
  const signature = decodeBase64(assertion.signature);
  const clientDataJson = decodeBase64(assertion.clientDataJson);
  const parsedClientData = JSON.parse(new TextDecoder().decode(clientDataJson));
  const authData = decodeBase64(assertion.authData);
  const parsedAuthData = parseAuthenticatorData(authData);
  const { type, origin, challenge } = parsedClientData;
  const { counter, flags, rpIdHash } = parsedAuthData;

  const isVerified = assertion.type === "public-key" &&
    type === "webauthn.get" &&
    challenge === expectedChallenge &&
    origin === expectedOrigin &&
    await matchRpIds(rpIdHash, expectedRpId) &&
    (counter > currentCounter || (counter === 0 && currentCounter === 0)) &&
    flags.up &&
    flags.uv &&
    await verifySignature({ signature, pubKey, clientDataJson, authData });

  if (isVerified) {
    return parsedAuthData;
  }
}
