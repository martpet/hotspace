import type { AppSettings } from "../types.ts";
import { kv } from "./kv.ts";

const keys = {
  settings: ["app_settings"],
};

export function setAppSettings(data: AppSettings) {
  return kv.set(keys.settings, data);
}

export function getAppSettings(consistency?: Deno.KvConsistencyLevel) {
  return kv.get<AppSettings>(keys.settings, { consistency });
}

export async function patchAppSettings(patch: Partial<AppSettings>) {
  let commit = { ok: false };
  while (!commit.ok) {
    const entry = await getAppSettings();
    const atomic = kv.atomic();
    atomic.check(entry);
    atomic.set(keys.settings, { ...entry.value, ...patch });
    commit = await atomic.commit();
  }
}
