import { asset } from "$server";
import type { JSX } from "preact/jsx-runtime";

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
        data-worker-src={asset(`/inodes/upload/worker.js`, { rawPath: true })}
      >
        Add Files…
      </button>
    </>
  );
}
