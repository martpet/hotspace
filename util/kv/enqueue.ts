import { ulid } from "@std/ulid";
import { kv } from "./kv.ts";

export function enqueue(
  msg: { type: string; nonce?: string },
  atomic: Deno.AtomicOperation,
) {
  msg.nonce = ulid();
  setQueueNonce(msg.nonce, atomic);
  return atomic.enqueue(msg, {
    keysIfUndelivered: [
      ["failed_queue_msgs", msg.nonce],
      ["failed_queue_msgs_by_type", msg.type, msg.nonce],
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
