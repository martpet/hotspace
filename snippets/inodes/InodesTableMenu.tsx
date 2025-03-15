import { asset } from "../../util/url.ts";

interface Props {
  dirId: string;
  isSpaces?: boolean;
}

export default function InodesTableMenu(props: Props) {
  const { dirId, isSpaces } = props;

  return (
    <div
      id="inodes-table-menu"
      data-dir-id={dirId}
      data-is-spaces={isSpaces ? "1" : null}
      hidden
    >
      <script type="module" src={asset("inodes/table_menu.js")} />

      <button id="inodes-table-delete-button">
        Delete {isSpaces ? "Space" : "Selected"}
      </button>
    </div>
  );
}
