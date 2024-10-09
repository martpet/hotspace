export const kv = await Deno.openKv();

export const IS_PROD_DB =
  (await kv.get(["prod"], { consistency: "eventual" })).value === true;
