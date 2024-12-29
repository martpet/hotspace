import { encodeHex } from "@std/encoding";
import {
  ASSET_CACHE_PARAM,
  DEPLOYMENT_ID,
  STATIC_FILES_PATH,
} from "./consts.ts";

let hex = "";

if (DEPLOYMENT_ID) {
  const bytes = new TextEncoder().encode(DEPLOYMENT_ID);
  hex = encodeHex(await crypto.subtle.digest("SHA-1", bytes));
}

interface AssetOptions {
  raw?: boolean;
}

export function asset(fileName: string, opt: AssetOptions = {}) {
  let path = fileName;
  if (!opt.raw) path = STATIC_FILES_PATH + "/" + path;
  if (!hex) return path;
  return `${path}?${ASSET_CACHE_PARAM}=${hex}`;
}
