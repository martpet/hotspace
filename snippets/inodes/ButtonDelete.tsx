import type { AppContext } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

// Uses /static/inodes/owner_common.js

export default function ButtonDelete(_: unknown, ctx: AppContext) {
  const { isDir, lastSegment } = parsePathname(ctx.url.pathname);

  return (
    <>
      <button
        id="delete-inode"
        disabled
        class="wait-disabled"
        data-inode-name={decodeURIComponent(lastSegment)}
      >
        Delete {isDir ? "Folder" : "File"}
      </button>
    </>
  );
}
