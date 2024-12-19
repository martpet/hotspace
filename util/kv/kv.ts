import { type OmitFirst, type ParamsWatchKv, watchKv } from "$util";
import { queueHandler } from "./queue_handlers/main_handler.ts";

export const kv = await Deno.openKv();

const prodEntry = await kv.get(["prod"], { consistency: "eventual" });
export const IS_PROD_DB = prodEntry.value === true;

kv.listenQueue(queueHandler);

export function watch<T extends unknown[]>(
  ...args: OmitFirst<ParamsWatchKv<T>>
) {
  return watchKv(kv, ...args);
}
