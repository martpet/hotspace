import { asset } from "$server";
import type { JSX } from "preact/jsx-runtime";
import { DIRNODE_NAME_CONSTRAINTS } from "../../util/constraints.ts";

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  isRoot?: boolean;
}

export default function ButtonCreateDir(props: Props) {
  const { isRoot, ...btnProps } = props;

  return (
    <>
      <script type="module" src={asset("inodes/create_dir.js")} />

      <button
        {...btnProps}
        id="show-create-dir"
        class="wait-disabled"
        disabled
        data-is-root-dir={isRoot}
        data-constraints={JSON.stringify(DIRNODE_NAME_CONSTRAINTS)}
      >
        {isRoot ? "Create Space" : "Create Folder"}…
      </button>
    </>
  );
}
