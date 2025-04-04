import { type OmitFirst, type ParamsWatchKv, watchKv } from "$util";
import { newQueue } from "@henrygd/queue";
import { chunk } from "@std/collections";

export const kv = await Deno.openKv();
export const prodKvEntry = await kv.get(["prod"], { consistency: "eventual" });

export function watch<T extends unknown[]>(
  ...args: OmitFirst<ParamsWatchKv<T>>
) {
  return watchKv(kv, ...args);
}

export async function saveWithRetry(entry: Deno.KvEntryMaybe<unknown>) {
  let i = 0;
  let commit = { ok: false };
  while (!commit.ok) {
    if (i > 0) entry = await kv.get(entry.key);
    const atomic = kv.atomic();
    atomic.check(entry);
    atomic.set(entry.key, entry.value);
    commit = await atomic.commit();
    i++;
  }
}

export function toKvSumBigInt(n: number) {
  if (n >= 0) return BigInt(n);
  const abs = BigInt(Math.abs(n));
  return (2n ** 64n) - abs;
}

export async function getManyEntries<T>(keys: Deno.KvKey[], options: {
  queueSize?: number;
  consistency?: Deno.KvConsistencyLevel;
} = {}) {
  const { consistency, queueSize = 5 } = options;
  const queue = newQueue(queueSize);
  const chunks = chunk(keys, 10);
  const chunkedEntries = await Promise.all(
    chunks.map((chunked) =>
      queue.add(() => kv.getMany<T[]>(chunked, { consistency }))
    ),
  );
  return chunkedEntries.flat();
}

export async function getMany<T>(keys: Deno.KvKey[], options: {
  queueSize?: number;
  consistency?: Deno.KvConsistencyLevel;
  withNullValues?: boolean;
} = {}) {
  const entries = await getManyEntries<T>(keys, options);
  const values: T[] = [];
  for (const entry of entries) {
    if (entry.value) values.push(entry.value);
  }
  return values;
}
