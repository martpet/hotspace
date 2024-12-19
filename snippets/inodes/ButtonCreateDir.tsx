import { asset } from "$server";
import type { JSX } from "preact/jsx-runtime";
import { INODE_NAME_CONSTRAINTS } from "../../util/constraints.ts";

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  isRootDir?: boolean;
}

export default function ButtonCreateDir(props: Props) {
  const { isRootDir, ...btnProps } = props;
  const classes = ["wait-disabled"];

  if (btnProps.class) classes.push(btnProps.class as string);

  return (
    <>
      <script type="module" src={asset("inodes.js")} />

      <button
        {...btnProps}
        type="button"
        disabled
        id="open-create-dir-dialog"
        class={classes.join(" ")}
        data-is-root-dir={isRootDir ? "1" : null}
      >
        Create {isRootDir ? "Space" : "Folder"}…
      </button>

      <template id="create-dir-template">
        <input
          type="text"
          name="dirName"
          required
          {...INODE_NAME_CONSTRAINTS}
        />
      </template>
    </>
  );
}
