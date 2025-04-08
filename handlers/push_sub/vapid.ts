import { encodeBase64Url } from "@std/encoding";
import type { AppContext } from "../../util/types.ts";

export default async function vapidHandler(ctx: AppContext) {
  const { vapidKeys } = await import("../../util/webpush.ts");

  const publicKey = encodeBase64Url(
    await crypto.subtle.exportKey("raw", vapidKeys.publicKey),
  );

  return ctx.json(publicKey);
}
