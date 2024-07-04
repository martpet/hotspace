import type { Context } from "../lib/types.ts";

export default function space(ctx: Context) {
  const { username } = ctx.patternResult!.hostname.groups;
  return `<h1>${username}</h1>`;
}
