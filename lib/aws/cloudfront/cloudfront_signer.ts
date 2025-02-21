import { HOUR } from "@std/datetime";
import { decodeBase64, encodeBase64 } from "@std/encoding";

interface Options {
  url: string;
  keyPairId: string;
  privateKey: string;
  expiresIn?: number;
  customPolicy?: Record<string, unknown>;
}

export async function signCloudFrontUrl(options: Options) {
  const {
    url,
    keyPairId,
    privateKey,
    expiresIn = HOUR,
    customPolicy,
  } = options;

  const expiresEpoch = Math.floor(Date.now() + expiresIn / 1000);
  const pemContents = privateKey.replace(/-----.*?-----/g, "");
  const keyData = decodeBase64(pemContents);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-1" },
    false,
    ["sign"],
  );

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
