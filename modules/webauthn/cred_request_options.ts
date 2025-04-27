import { WEBAUTHN_TIMEOUT } from "./consts.ts";
import { generateChallenge } from "./generate_challenge.ts";

interface CreateCredentialRequestOptionsOptions {
  rpId: string;
  timeout?: number;
}

type Result = Omit<PublicKeyCredentialRequestOptions, "challenge"> & {
  challenge: string;
};

export function createCredentialRequestOptions(
  opt: CreateCredentialRequestOptionsOptions,
): Result {
  return {
    rpId: opt.rpId,
    challenge: generateChallenge(),
    userVerification: "required",
    timeout: opt.timeout || WEBAUTHN_TIMEOUT,
  };
}
