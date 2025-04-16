import { ASSET_CACHE_PARAM } from "$server";
import { ASSETS_CLOUDFRONT_URL, LOCAL_DEV_PUBLIC_URL } from "./consts.ts";
import { DEPLOYMENT_HEX } from "./deployment_hex.ts";

export function asset(pathname: string, options: { cdn?: boolean } = {}) {
  const { cdn = true } = options;
  let url = `/${pathname}`;
  if (cdn && ASSETS_CLOUDFRONT_URL) {
    url = ASSETS_CLOUDFRONT_URL + url;
  } else {
    url = "/assets" + url;
  }
  if (DEPLOYMENT_HEX) url += `?${ASSET_CACHE_PARAM}=${DEPLOYMENT_HEX}`;
  return url;
}

export function getDevAppUrl(origin: string) {
  return LOCAL_DEV_PUBLIC_URL || origin;
}
