import type { Context } from "../lib/types.ts";

export default function space(ctx: Context) {
  const { spacename } = ctx.patternResult!.hostname.groups;
  return `<h1>${spacename}</h1>`;
}
