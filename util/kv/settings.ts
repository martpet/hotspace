import type { Settings } from "../types.ts";
import { kv } from "./kv.ts";

const key = ["settings"];

export function setSettings(settings: Settings) {
  return kv.set(key, settings);
}

export function getSettings(consistency?: Deno.KvConsistencyLevel) {
  return kv.get<Settings>(key, { consistency });
}
