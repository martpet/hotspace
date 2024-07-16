import type { Context } from "../lib/types.ts";

export default function userspaceRoute(ctx: Context) {
  const { username } = ctx.urlPatternResult!.hostname.groups;
  return `<h1>${username}</h1>`;
}
