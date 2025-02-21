import type { JSX } from "preact/jsx-runtime";
import { DIR_NAME_CONSTRAINTS } from "../../util/constraints.ts";
import { asset } from "../../util/url.ts";

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
        data-constraints={JSON.stringify(DIR_NAME_CONSTRAINTS)}
      >
        Create {isRoot ? "Space" : "Folder"}
      </button>
    </>
  );
}
