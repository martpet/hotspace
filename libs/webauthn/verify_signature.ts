import { concat } from "@std/bytes";

export interface VerifySignatureOptions {
  clientDataJson: Uint8Array;
  signature: Uint8Array;
  authData: Uint8Array;
  pubKey: Uint8Array;
}

export async function verifySignature(opt: VerifySignatureOptions) {
  const {
    signature,
    pubKey,
    authData,
    clientDataJson,
  } = opt;
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
    signedData,
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
