import { getInodeLabel } from "../../util/inodes/helpers.ts";
import type { Inode } from "../../util/inodes/types.ts";

interface Props {
  inode: Inode;
}

export default function ButtonDeleteInode() {
  return (
    <button
      command="show-modal"
      commandfor="delete-inode-dilaog"
    >
      <i class="icn-trash" />
      Delete page
    </button>
  );
}

export function DialogDeleteInode({ inode }: Props) {
  const inodeLabel = getInodeLabel(inode);
  const inodeName = decodeURIComponent(inode.name);

  return (
    <dialog id="delete-inode-dilaog">
      <h1>Delete page</h1>
      <form method="post" action="/inodes/delete" class="basic">
        <input type="hidden" name="dirId" value={inode.parentDirId} />
        <input type="hidden" name="inodeName" value={inode.name} />
        <p class="alert warning">
          {inodeLabel} <strong>{inodeName}</strong> and its{" "}
          {inode.type === "dir" ? "content" : "chat messages"} will be deleted.
          {" "}
          <span class="text-undone">This action cannot be undone.</span>
        </p>
        <label>
          <span>
            To confirm, type the name of the {inodeLabel.toLowerCase()}:
          </span>
          <input
            type="text"
            autofocus
            required
            pattern={espacdRegExp(inodeName)}
          />
        </label>
        <footer>
          <button>Permanently delete</button>
          <button formmethod="dialog" formnovalidate style={{ order: -1 }}>
            Cancel
          </button>
        </footer>
      </form>
    </dialog>
  );
}

// Until Deploy is on Deno/2.3.3
function espacdRegExp(input: string) {
  return RegExp.escape
    ? RegExp.escape(input)
    : input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
