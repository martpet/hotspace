import type { AppSettings } from "../types.ts";
import { kv } from "./kv.ts";

const keys = {
  settings: ["app_settings"],
};

export function setAppSettings(data: AppSettings) {
  return kv.set(keys.settings, data);
}

export function getAppSettings() {
  return kv.get<AppSettings>(keys.settings);
}
