import type { InodeLabel } from "../../util/inodes/types.ts";
import { asset } from "../../util/url.ts";

interface Props {
  dirId: string;
  isSingleSelect?: boolean;
  inodeLabel?: InodeLabel;
}

export default function InodesTableMenu(props: Props) {
  const { dirId, isSingleSelect, inodeLabel } = props;

  return (
    <div
      id="inodes-table-menu"
      data-dir-id={dirId}
      data-is-single-select={isSingleSelect ? "1" : null}
      data-inode-label={isSingleSelect ? inodeLabel : null}
      hidden
    >
      <script type="module" src={asset("inodes/table_menu.js")} />

      <button id="inodes-table-delete-button">
        Delete {isSingleSelect ? inodeLabel : "Selected"}
      </button>
    </div>
  );
}
