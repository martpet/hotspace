import Page from "../../components/pages/Page.tsx";
import { kv } from "../../utils/db.ts";
import type { Context } from "../../utils/types.ts";

function DbResetForm(props: { entriesCount: number }) {
  return (
    <form
      method="post"
      action="/dev/reset-db"
      style={{ display: "flex", alignItems: "center", gap: 10 }}
    >
      DB Entries Count: {props.entriesCount}
      <button>Delete all</button>
    </form>
  );
}

export default async function devHandler({ isDev }: Context) {
  if (!isDev) {
    return new Response(null, { status: 403 });
  }

  const dbEntries = await Array.fromAsync(kv.list({ prefix: [] }));

  return (
    <Page>
      <DbResetForm entriesCount={dbEntries.length} />
    </Page>
  );
}
