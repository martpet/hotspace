import type { InodeLabel } from "../../util/inodes/types.ts";
import { asset } from "../../util/url.ts";

interface Props {
  dirId: string;
  isSingleSelect?: boolean;
  inodeLabel?: InodeLabel;
}

export default function TableActions(props: Props) {
  const { dirId, isSingleSelect, inodeLabel } = props;

  return (
    <div
      id="table-actions"
      data-dir-id={dirId}
      data-is-single-select={isSingleSelect ? "1" : null}
      data-inode-label={isSingleSelect ? inodeLabel : null}
      hidden
    >
      <script type="module" src={asset("inodes/table_actions.js")} />

      <button id="table-delete-button">
        Delete {isSingleSelect ? inodeLabel : "Selected"}
      </button>
    </div>
  );
}
