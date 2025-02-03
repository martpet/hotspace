import { encodeHex } from "@std/encoding";

export async function textToSha256Hex(text: string) {
  const uint8 = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", uint8);
  return encodeHex(hashBuf);
}
