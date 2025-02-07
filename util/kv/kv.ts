import { type OmitFirst, type ParamsWatchKv, watchKv } from "$util";

export const kv = await Deno.openKv();
export const prodKvEntry = await kv.get(["prod"], { consistency: "eventual" });

export function watch<T extends unknown[]>(
  ...args: OmitFirst<ParamsWatchKv<T>>
) {
  return watchKv(kv, ...args);
}

export function getKvSumBigInt(n: number) {
  if (n >= 0) return BigInt(n);
  const abs = BigInt(Math.abs(n));
  return (2n ** 64n) - abs;
}
