import { DirNode } from "../../util/types.ts";
import { asset } from "../../util/url.ts";

interface Props {
  inode: DirNode;
}

export default function BatchOperationsButtons(props: Props) {
  const { inode } = props;

  return (
    <div id="batch-operations-buttons" hidden>
      <script type="module" src={asset("inodes/batch_operations.js")} />

      <button
        id="batch-delete-button"
        data-dir-id={inode.id}
      >
        Delete Selected
      </button>
    </div>
  );
}
