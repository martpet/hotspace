import { type OmitFirst, type ParamsWatchKv, watchKv } from "$util";

export const kv = await Deno.openKv();
export const prodKvEntry = await kv.get(["prod"], { consistency: "eventual" });

export function watch<T extends unknown[]>(
  ...args: OmitFirst<ParamsWatchKv<T>>
) {
  return watchKv(kv, ...args);
}
