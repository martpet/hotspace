import { encodeHex } from "@std/encoding";
import { ASSET_CACHE_PARAM, STATIC_FILES_PATH } from "../consts.ts";

export async function cachedAssetPath(version?: string) {
  let hex: string;
  if (version) {
    const bytes = new TextEncoder().encode(version);
    hex = encodeHex(await crypto.subtle.digest("SHA-1", bytes));
  }
  return (fileName: string) => {
    const path = `${STATIC_FILES_PATH}/${fileName}`;
    if (!hex) return path;
    return `${path}?${ASSET_CACHE_PARAM}=${hex}`;
  };
}
