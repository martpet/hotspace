import { HOUR } from "@std/datetime";
import { decodeBase64, encodeBase64 } from "@std/encoding";

const keyCache = new Map<string, CryptoKey>();

async function getCryptoKey(privateKey: string) {
  if (keyCache.has(privateKey)) {
    return keyCache.get(privateKey)!;
  }

  const pemContents = privateKey.replace(/-----.*?-----|\s+/g, "");
  const keyData = decodeBase64(pemContents);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-1" },
    false,
    ["sign"],
  );

  keyCache.set(privateKey, cryptoKey);
  return cryptoKey;
}

export interface SignUrlOptions {
  url: string;
  keyPairId: string;
  privateKey: string;
  expireIn?: number;
  customPolicy?: Record<string, unknown>;
}

export async function signUrl(options: SignUrlOptions) {
  const {
    url,
    keyPairId,
    privateKey,
    expireIn = HOUR,
    customPolicy,
  } = options;

  const expiresEpoch = Math.floor(Date.now() + expireIn / 1000);
  const cryptoKey = await getCryptoKey(privateKey);

  const policy = customPolicy || {
    Statement: [{
      Resource: url,
      Condition: {
        DateLessThan: { "AWS:EpochTime": expiresEpoch },
      },
    }],
  };

  const binPolicy = new TextEncoder().encode(JSON.stringify(policy));

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    binPolicy,
  );

  const signedUrl = new URL(url);

  signedUrl.searchParams.append("Signature", encodeBase64(signature));
  signedUrl.searchParams.append("Key-Pair-Id", keyPairId);

  if (customPolicy) {
    signedUrl.searchParams.append("Policy", encodeBase64(binPolicy));
  } else {
    signedUrl.searchParams.append("Expires", expiresEpoch.toString());
  }

  return signedUrl.href;
}
