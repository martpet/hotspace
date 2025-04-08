import { WEBAUTHN_TIMEOUT } from "./consts.ts";
import { generateChallenge } from "./generate_challenge.ts";

interface CreateCredentialCreationOptionsOptions {
  rpId: string;
  rpName: string;
  userName: string;
  userDisplayName: string;
  webauthnUserId: string;
  excludeCredentials: string[];
  timeout?: number;
}

type Result =
  & Omit<
    PublicKeyCredentialCreationOptions,
    "user" | "challenge" | "excludeCredentials"
  >
  & {
    challenge: string;
    excludeCredentials: { id: string; type: "public-key" }[];
    user: Omit<PublicKeyCredentialCreationOptions["user"], "id"> & {
      id: string;
    };
  };

export function createCredentialCreationOptions(
  opt: CreateCredentialCreationOptionsOptions,
): Result {
  const {
    rpName,
    rpId,
    webauthnUserId,
    userName,
    userDisplayName,
    timeout,
    excludeCredentials,
  } = opt;

  return {
    challenge: generateChallenge(),
    timeout: timeout || WEBAUTHN_TIMEOUT,
    rp: {
      name: rpName,
      id: rpId,
    },
    user: {
      id: webauthnUserId,
      name: userName,
      displayName: userDisplayName,
    },

    authenticatorSelection: {
      requireResidentKey: true,
      residentKey: "required",
      userVerification: "required",
    },
    excludeCredentials: excludeCredentials.map((id) => ({
      type: "public-key",
      id,
    })),
    pubKeyCredParams: [
      {
        type: "public-key",
        alg: -7,
      },
    ],
  };
}
