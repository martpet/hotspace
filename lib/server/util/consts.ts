export const DEPLOYMENT_ID = Deno.env.get("DENO_DEPLOYMENT_ID");
export const IS_LOCAL_DEV = DEPLOYMENT_ID === undefined;
export const STATIC_FILES_PATH = "/static";
export const ASSET_CACHE_PARAM = "__c";
export const FLASH_COOKIE = "flash";
