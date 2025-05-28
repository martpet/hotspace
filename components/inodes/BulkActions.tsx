import type { InodeLabel } from "../../util/inodes/types.ts";
import { asset } from "../../util/url.ts";

interface Props {
  dirId: string;
  isSingleSelect?: boolean;
  inodeLabel?: InodeLabel;
}

export default function BulkActions(props: Props) {
  const { dirId, isSingleSelect, inodeLabel } = props;

  return (
    <div
      id="bulk-actions"
      data-dir-id={dirId}
      data-is-single-select={isSingleSelect ? "1" : null}
      data-inode-label={isSingleSelect ? inodeLabel : null}
      hidden
    >
      <script type="module" src={asset("inodes/bulk_actions.js")} />

      <button id="bulk-delete-button">
        Delete {isSingleSelect ? inodeLabel : "Selected"}
      </button>
    </div>
  );
}
