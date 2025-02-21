import { signCloudFrontUrl } from "$aws";
import { ASSET_CACHE_PARAM } from "$server";
import {
  ASSETS_CLOUDFRONT_URL,
  CLOUDFRONT_KEYPAIR_ID,
  CLOUDFRONT_SIGNER_PRIVATE_KEY,
} from "./consts.ts";
import { DEPLOYMENT_HEX } from "./deployment_hex.ts";

export function signUploadUrl(url: string) {
  return signCloudFrontUrl({
    url,
    keyPairId: CLOUDFRONT_KEYPAIR_ID,
    privateKey: CLOUDFRONT_SIGNER_PRIVATE_KEY,
  });
}

export function asset(pathname: string, options: { cdn?: boolean } = {}) {
  const { cdn = true } = options;
  let url = `/${pathname}`;
  if (cdn && ASSETS_CLOUDFRONT_URL) {
    url = ASSETS_CLOUDFRONT_URL + url;
  } else {
    url = "/static" + url;
  }
  if (DEPLOYMENT_HEX) url += `?${ASSET_CACHE_PARAM}=${DEPLOYMENT_HEX}`;
  return url;
}
