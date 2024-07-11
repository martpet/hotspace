import type { Context } from "../lib/types.ts";

export default function userspace(ctx: Context) {
  const { username } = ctx.urlPatternResult!.hostname.groups;
  return `<h1>${username}</h1>`;
}
