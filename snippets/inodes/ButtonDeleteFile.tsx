import { asset } from "$server";
import type { AppContext } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

export default function ButtonDeleteFile(_: unknown, ctx: AppContext) {
  const { lastPathSegment } = parsePathname(ctx.url.pathname);

  return (
    <>
      <script type="module" src={asset("inodes/delete_file.js")} />
      <button
        id="delete-button"
        class="wait-disabled"
        disabled
        data-inode-name={decodeURIComponent(lastPathSegment)}
      >
        Delete File
      </button>
    </>
  );
}
