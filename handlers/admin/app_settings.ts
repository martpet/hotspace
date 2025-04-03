import { APP_ADMIN } from "../../util/consts.ts";
import { setAppSettings } from "../../util/kv/app.ts";
import type { AppContext } from "../../util/types.ts";

export default async function appSettingsHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user || user.username !== APP_ADMIN) {
    ctx.setFlash({ type: "error", msg: "Forbidden" });
    return ctx.redirectBack();
  }

  const formData = await ctx.req.formData();

  await setAppSettings({
    isUploadEnabled: formData.has("isUplaodEnabled"),
  });

  ctx.setFlash("Settings saved");

  return ctx.redirectBack();
}
