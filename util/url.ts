import { cachedAssetPath } from "$server";
import { DEPLOYMENT_ID } from "./consts.ts";

export const asset = await cachedAssetPath(DEPLOYMENT_ID);
