import { ulid } from "@std/ulid";
import { kv } from "./kv.ts";

export function enqueue<T extends { type: string; nonce?: string }>(
  msg: T,
  atomic: Deno.AtomicOperation = kv.atomic(),
  delay?: number,
) {
  const id = ulid();

  return atomic.enqueue(msg, {
    delay,
    keysIfUndelivered: [
      ["failed_queue_msgs", id],
      ["failed_queue_msgs_by_type", msg.type, id],
    ],
  });
}
