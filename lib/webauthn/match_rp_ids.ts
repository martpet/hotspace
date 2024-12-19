import { equals } from "@std/bytes";

export async function matchRpIds(rpIdHash: Uint8Array, expectedRpId: string) {
  const bytes = new TextEncoder().encode(expectedRpId);
  const hash = await crypto.subtle.digest("SHA-256", bytes);

  return equals(rpIdHash, new Uint8Array(hash));
}
