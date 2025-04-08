import type { AppSettings } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  settings: ["app_settings"],
};

export function setAppSettings(data: AppSettings, atomic = kv.atomic()) {
  return atomic.set(keys.settings, data);
}

export function getAppSettings(consistency?: Deno.KvConsistencyLevel) {
  return kv.get<AppSettings>(keys.settings, { consistency });
}

export async function patchSettings(
  entry: Deno.KvEntryMaybe<AppSettings>,
  patch: Partial<AppSettings>,
) {
  let commit = { ok: false };
  let commitIndex = 0;
  while (!commit.ok) {
    if (commitIndex) entry = await getAppSettings();
    const { value } = entry;
    if (!value) return;
    const atomic = setAppSettings({ ...value, ...patch });
    atomic.check(entry);
    commit = await atomic.commit();
    commitIndex++;
  }
}
