import { decodeBase64 } from "@std/encoding";
import { matchRpIds } from "./match_rp_ids.ts";
import {
  parseAuthenticatorData,
  ParsedAuthenticatorData,
} from "./parse_authenticator_data.ts";

export interface VerifyAttestationOptions {
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRpId: string;
  attestation: {
    type: string;
    authData: string;
    clientDataJson: string;
    pubKey: string;
  };
}

export async function verifyAttestation(opt: VerifyAttestationOptions) {
  const {
    attestation,
    expectedChallenge,
    expectedOrigin,
    expectedRpId,
  } = opt;

  const clientDataJson = decodeBase64(attestation.clientDataJson);
  const parsedClientData = JSON.parse(new TextDecoder().decode(clientDataJson));
  const authData = decodeBase64(attestation.authData);
  const parsedAuthData = parseAuthenticatorData(authData);
  const { type, challenge, origin } = parsedClientData;
  const { counter, credId, aaguid, flags, rpIdHash } = parsedAuthData;

  const isVerified = attestation.type === "public-key" &&
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

  if (isVerified) {
    return parsedAuthData as Required<ParsedAuthenticatorData>;
  }
}
