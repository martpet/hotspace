import { encodeHex } from "@std/encoding";
import { DEPLOYMENT_ID } from "./consts.ts";

let hex = "";

if (DEPLOYMENT_ID) {
  const bytes = new TextEncoder().encode(DEPLOYMENT_ID);
  hex = encodeHex(await crypto.subtle.digest("SHA-1", bytes));
}

export const DEPLOYMENT_HEX = hex;
