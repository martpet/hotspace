import { MINUTE, WEEK } from "@std/datetime";

export const DEPLOYMENT_ID = Deno.env.get("DENO_DEPLOYMENT_ID");
export const IS_LOCAL_DEV = DEPLOYMENT_ID === undefined;
export const GENERAL_ERROR_MSG = "Oops, something went wrong, try again!";
export const SESSION_TIMEOUT = WEEK * 4;
export const CHAT_MSG_FOLLOWUP_DURATION = MINUTE * 2;
