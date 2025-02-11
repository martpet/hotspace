import { asset } from "$server";
import type { AppContext } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

export default function ButtonDelete(_: unknown, ctx: AppContext) {
  const { isDir, lastSegment } = parsePathname(ctx.url.pathname);

  return (
    <>
      <script type="module" src={asset("inodes/delete.js")} />
      <button
        id="delete-button"
        class="wait-disabled"
        disabled
        data-inode-name={decodeURIComponent(lastSegment)}
      >
        Delete {isDir ? "Folder" : "File"}
      </button>
    </>
  );
}
