import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import {
  SPACE_DESCRIPTION_CONSTRAINTS,
  SPACE_NAME_CONSTRAINTS,
} from "../../util/constraints.ts";
import { GENERAL_ERROR_MSG } from "../../util/consts.ts";
import { keys as spaceKvKeys, setSpace } from "../../util/db/spaces.ts";
import { reservedWords } from "../../util/reserved_words.ts";
import type { AppContext, Space } from "../../util/types.ts";

export default async function createSpace(ctx: AppContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const formData = await ctx.req.formData();
  const formEntries = Object.fromEntries(formData.entries());

  if (!validateFormEntries(formEntries)) {
    ctx.setFlash({ type: "error", msg: "Invalid form fields!" });
    return ctx.redirectBack();
  }

  const { name, description } = formEntries;

  if (reservedWords.includes(name)) {
    ctx.setFlash({
      type: "error",
      msg: `Name "${name}" is not available, try another!`,
    });
    return ctx.redirectBack();
  }

  const space: Space = {
    id: ulid(),
    name,
    ownerUsername: user.username,
    description,
  };

  const commit = await setSpace(space)
    .check({ key: spaceKvKeys.byName(name), versionstamp: null })
    .commit();

  if (!commit.ok) {
    ctx.setFlash({ type: "error", msg: GENERAL_ERROR_MSG });
    return ctx.redirectBack();
  }

  ctx.setFlash(`Created space '${space.name}'`);
  return ctx.redirect(`/${name}`);
}

function validateFormEntries(
  entries: Record<string, FormDataEntryValue>,
): entries is Pick<Space, "name" | "description"> {
  return typeof entries.name === "string" &&
      entries.name.length >= SPACE_NAME_CONSTRAINTS.minLength &&
      entries.name.length <= SPACE_NAME_CONSTRAINTS.maxLength &&
      new RegExp(SPACE_NAME_CONSTRAINTS.pattern).test(entries.name) &&
      entries.description === undefined ||
    typeof entries.description === "string" &&
      entries.description.length <= SPACE_DESCRIPTION_CONSTRAINTS.maxLength;
}
