import { STATUS_CODE } from "@std/http";
import { GENERAL_ERR_MSG } from "../../util/consts.ts";
import { kv } from "../../util/kv/kv.ts";
import { enqueueCleanupChatData } from "../../util/kv/queue_handlers/cleanup_chat_data.ts";
import { deleteSpace, getSpaceByName } from "../../util/kv/spaces.ts";
import type { AppContext } from "../../util/types.ts";

export default async function deleteSpaceHandler(ctx: AppContext) {
  const user = ctx.state.user;
  const formData = await ctx.req.formData();
  const spaceName = formData.get("spaceName") as string;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  if (!spaceName) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
    return ctx.redirectBack();
  }

  const space = (await getSpaceByName(spaceName)).value;

  if (!space) {
    const msg = `Error: space '${spaceName}' doesn't exist.`;
    ctx.setFlash({ type: "error", msg });
    return ctx.redirectBack();
  }

  if (space.ownerUsername !== user.username) {
    const msg = `Error: you don't own space "${spaceName}".`;
    ctx.setFlash({ type: "error", msg });
    return ctx.redirectBack();
  }

  const atomic = kv.atomic();
  deleteSpace(space, atomic);
  enqueueCleanupChatData(space.id, atomic);

  const { ok } = await atomic.commit();

  if (!ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERR_MSG });
    return ctx.redirectBack();
  }

  ctx.setFlash(`Deleted space '${spaceName}'`);

  return ctx.redirect("/");
}
