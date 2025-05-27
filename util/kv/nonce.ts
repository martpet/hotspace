import { kv } from "./kv.ts";

export function setNonce(nonce: string, atomic: Deno.AtomicOperation) {
  return atomic.set(["nonces", nonce], true);
}

export function deleteNonce(nonce: string, atomic: Deno.AtomicOperation) {
  return atomic.delete(["nonces", nonce]);
}

export function getNonce(nonce: string) {
  return kv.get<true>(["nonces", nonce]);
}
