import type { JSX } from "preact/jsx-runtime";
import { ROOT_DIR_ID } from "../../util/inodes/consts.ts";
import { DIR_NAME_CONSTRAINTS } from "../../util/input_constraints.ts";
import { asset } from "../../util/url.ts";

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  parentDirId: string;
  isRoot?: boolean;
}

export default function ButtonCreateDir(props: Props) {
  const { parentDirId, ...btnProps } = props;
  const isSpace = parentDirId === ROOT_DIR_ID;

  return (
    <>
      <script type="module" src={asset("inodes/create_dir.js")} />

      <button
        {...btnProps}
        id="show-create-dir"
        class="wait-disabled"
        disabled
        data-parent-dir-id={parentDirId}
        data-is-space={isSpace ? "1" : null}
        data-constraints={JSON.stringify(DIR_NAME_CONSTRAINTS)}
      >
        {isSpace
          ? (
            <>
              <i class="icn-plus-lg" />
              New Space
            </>
          )
          : (
            <>
              <i class="icn-folder-plus" />
              Create Folder
            </>
          )}
      </button>
    </>
  );
}
