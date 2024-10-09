import { STATUS_CODE } from "@std/http";
import { GENERAL_ERROR_MSG } from "../../util/consts.ts";
import { deleteSpace, getSpaceByName } from "../../util/db/spaces.ts";
import type { AppContext } from "../../util/types.ts";

export default async function deleteSpaceHandler(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const formData = await ctx.req.formData();
  const spaceName = formData.get("spaceName") as string;

  if (!spaceName) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERROR_MSG });
    return ctx.redirectBack();
  }

  const spaceEntry = await getSpaceByName(spaceName);
  const space = spaceEntry.value;

  if (!space) {
    ctx.setFlash({
      type: "error",
      msg: `Error: space "${spaceName}" doesn't exist.`,
    });
    return ctx.redirectBack();
  }

  if (space.ownerUsername !== user.username) {
    ctx.setFlash({
      type: "error",
      msg: `Error: you don't own space "${spaceName}".`,
    });
    return ctx.redirectBack();
  }

  const commit = await deleteSpace(space).check(spaceEntry).commit();

  if (!commit.ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERROR_MSG });
    return ctx.redirectBack();
  }

  ctx.setFlash(`Deleted space '${spaceName}'`);
  return ctx.redirect("/");
}
