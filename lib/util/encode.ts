import { encodeBase64, encodeHex } from "@std/encoding";

export function toSha256(str: string) {
  const data = new TextEncoder().encode(str);
  return crypto.subtle.digest("SHA-256", data);
}

export async function toSha256Hex(str: string) {
  return encodeHex(await toSha256(str));
}

export async function toSha256Base64(str: string) {
  return encodeBase64(await toSha256(str));
}
