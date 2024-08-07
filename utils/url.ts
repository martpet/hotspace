import { BASE_HOSTNAME_URLPATTERN } from "./consts.ts";

export function findBaseUrl(url: URL) {
  const regexp = new RegExp(BASE_HOSTNAME_URLPATTERN + "$");
  const hostname = regexp.exec(url.hostname)?.[0];
  if (!hostname || hostname === url.hostname) return null;
  const base = new URL(url);
  base.hostname = hostname;
  return base.origin;
}
