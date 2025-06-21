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
        btnContent="Manage items"
        menuId="bulk-actions-menu"
        id="bulk-actions"
        data-dir-id={dirId}
        data-is-single-select={isSingleSelect ? "1" : null}
        data-inode-label={isSingleSelect ? inodeLabel : null}
        hidden
      >
        <button id="bulk-delete-button">
          <i class="icn-trash" />Delete selected
        </button>
      </PopMenu>
    </>
  );
}
