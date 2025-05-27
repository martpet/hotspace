import { ulid } from "@std/ulid";
import { kv } from "./kv.ts";
import { setNonce } from "./nonce.ts";

export function enqueue<T extends { type: string; nonce?: string }>(
  msg: T,
  atomic: Deno.AtomicOperation = kv.atomic(),
  delay?: number,
) {
  const id = ulid();

  const keysIfUndelivered = [
    ["failed_queue", id],
    ["failed_queue_by_type", msg.type, id],
  ];

  if (msg.nonce) {
    setNonce(msg.nonce, atomic);
  }

  return atomic.enqueue(msg, { delay, keysIfUndelivered });
}
