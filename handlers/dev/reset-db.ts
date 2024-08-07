import { kv } from "../../utils/db.ts";
import type { Context } from "../../utils/types.ts";

export default async function resetDb({ req, isDev }: Context) {
  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  if (!isDev) {
    return new Response(null, { status: 403 });
  }

  const rows = kv.list({ prefix: [] });

  for await (const row of rows) {
    kv.delete(row.key);
  }

  return Response.redirect(req.headers.get("referer")!);
}
