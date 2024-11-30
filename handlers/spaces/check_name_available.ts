import { STATUS_CODE } from "@std/http";
import { getSpaceByName } from "../../util/kv/spaces.ts";
import { reservedWords } from "../../util/reserved_words.ts";
import type { AppContext } from "../../util/types.ts";

export default async function checkSpaceAvailableHandler(ctx: AppContext) {
  const user = ctx.state.user;
  const spaceName = await ctx.req.text();

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  if (reservedWords.includes(spaceName)) {
    return ctx.json({
      isAvailable: false,
      reason: `Sorry, the name "${spaceName}" is reserved by the system`,
    });
  }

  const currentSpace =
    (await getSpaceByName(spaceName, { consistency: "eventual" })).value;

  if (currentSpace) {
    const isOwner = currentSpace.ownerUsername === user.username;
    return ctx.json({
      isAvailable: false,
      reason: isOwner
        ? `You already have a space named '${spaceName}'`
        : `The name "${spaceName}" is taken by another user`,
    });
  }

  return ctx.json({ isAvailable: true });
}
