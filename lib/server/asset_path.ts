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

export function asset(fileName: string) {
  const filePath = `${STATIC_FILES_PATH}/${fileName}`;
  if (!hex) return filePath;
  return `${filePath}?${ASSET_CACHE_PARAM}=${hex}`;
}
