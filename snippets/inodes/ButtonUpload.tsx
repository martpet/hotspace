import type { JSX } from "preact/jsx-runtime";
import { asset } from "../../util/url.ts";

type Props = JSX.HTMLAttributes<HTMLButtonElement>;

export default function ButtonUpload(props: Props) {
  return (
    <>
      <script type="module" src={asset("inodes/upload.js")} />

      <button
        {...props}
        id="show-upload"
        disabled
        class="wait-disabled"
        data-worker-src={asset("upload_worker.js", { cdn: false })}
      >
        Add Files…
      </button>
    </>
  );
}
