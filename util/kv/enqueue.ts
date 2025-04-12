import { ulid } from "@std/ulid";
import { kv } from "./kv.ts";

export function enqueue<T extends { type: string; nonce?: string }>(
  msg: T,
  atomic: Deno.AtomicOperation = kv.atomic(),
  delay?: number,
) {
  if (msg.nonce) {
    setQueueNonce(msg.nonce, atomic);
  }

  const id = ulid();

  return atomic.enqueue(msg, {
    delay,
    keysIfUndelivered: [
      ["failed_queue_msgs", id],
      ["failed_queue_msgs_by_type", msg.type, id],
    ],
  });
}

export function setQueueNonce(nonce: string, atomic: Deno.AtomicOperation) {
  return atomic.set(["queue_nonces", nonce], true);
}

export function getQueueNonce(nonce: string) {
  return kv.get<true>(["queue_nonces", nonce]);
}

export function deleteQueueNonce(nonce: string) {
  return kv.delete(["queue_nonces", nonce]);
}
