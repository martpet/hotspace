import type { InodeLabel } from "../../util/inodes/types.ts";
import { asset } from "../../util/url.ts";
import PopMenu from "../PopMenu.tsx";

interface Props {
  dirId: string;
  isSingleSelect?: boolean;
  inodeLabel?: InodeLabel;
}

export default function TableActions(props: Props) {
  const { dirId, isSingleSelect, inodeLabel } = props;

  return (
    <>
      <script type="module" src={asset("inodes/bulk_actions.js")} />

      <PopMenu
        btnText="Actions"
        id="bulk-actions"
        data-dir-id={dirId}
        data-is-single-select={isSingleSelect ? "1" : null}
        data-inode-label={isSingleSelect ? inodeLabel : null}
        hidden
      >
        <button id="bulk-delete-button">
          Delete {isSingleSelect ? inodeLabel : "Selected"}
        </button>
      </PopMenu>
    </>
  );
}
