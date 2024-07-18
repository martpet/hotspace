import type { Context } from "../lib/app/types.ts";

export default function spaceRoute(ctx: Context) {
  const { username } = ctx.urlPatternResult!.hostname.groups;
  return `<h1>${username}</h1>`;
}
