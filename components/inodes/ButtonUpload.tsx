import type { JSX } from "preact/jsx-runtime";
import { asset } from "../../util/url.ts";

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  dirId: string;
}

export default function ButtonUpload(props: Props) {
  const { dirId, ...buttonProps } = props;

  return (
    <>
      <script type="module" src={asset("inodes/upload.js")} />

      <button
        {...buttonProps}
        id="show-upload"
        disabled
        class="wait-disabled"
        data-dir-id={dirId}
        data-worker-src={asset("upload_worker.js", { cdn: false })}
      >
        Upload Files
      </button>
    </>
  );
}
