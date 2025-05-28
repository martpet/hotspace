import { STATUS_CODE, StatusCode } from "@std/http";

export const ASSET_CACHE_PARAM = "__c";
export const FLASH_COOKIE = "flash";

export const REDIRECT_STATUS_CODES: StatusCode[] = [
  STATUS_CODE.MovedPermanently,
  STATUS_CODE.Found,
  STATUS_CODE.SeeOther,
  STATUS_CODE.TemporaryRedirect,
  STATUS_CODE.PermanentRedirect,
];
