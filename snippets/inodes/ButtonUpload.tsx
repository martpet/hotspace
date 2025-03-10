import type { JSX } from "preact/jsx-runtime";
import type { DirNode } from "../../util/types.ts";
import { asset } from "../../util/url.ts";

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  dirNode: DirNode;
}

export default function ButtonUpload(props: Props) {
  const { dirNode, ...buttonProps } = props;

  return (
    <>
      <script type="module" src={asset("inodes/upload.js")} />

      <button
        {...buttonProps}
        id="show-upload"
        disabled
        class="wait-disabled"
        data-dir-id={dirNode.id}
        data-worker-src={asset("upload_worker.js", { cdn: false })}
      >
        Add Files
      </button>
    </>
  );
}
